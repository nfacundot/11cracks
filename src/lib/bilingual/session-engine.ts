import type {
  AnswerAttempt,
  BilingualJourneyProgress,
  BilingualSessionConfig,
  BilingualSessionProgress,
  ObjectiveLearningState,
  TargetLanguage,
} from "./game-contracts";

const now = () => new Date().toISOString();

function initialObjectiveState(objectiveId: string): ObjectiveLearningState {
  return {
    objectiveId,
    seen: false,
    attempted: false,
    attempts: 0,
    correct: false,
    incorrect: false,
    needsReview: false,
    reinforced: false,
    completed: false,
    assisted: false,
  };
}

export function createJourneyProgress(playerId: string, targetLanguage: TargetLanguage = "en"): BilingualJourneyProgress {
  return { version: 1, playerId, targetLanguage, sessions: {}, activeGameId: null, completedGameIds: [], updatedAt: now() };
}

export function createSessionProgress(session: BilingualSessionConfig): BilingualSessionProgress {
  const objectiveStates = Object.fromEntries(
    session.objectives.map((objective) => [objective.id, initialObjectiveState(objective.id)]),
  );
  return {
    gameId: session.gameId,
    environmentId: session.environmentId,
    sessionId: session.id,
    targetLanguage: session.targetLanguage,
    phase: "intro",
    currentObjectiveIndex: 0,
    completedObjectiveIds: [],
    reviewObjectiveIds: [],
    reinforcedObjectiveIds: [],
    objectiveStates,
    score: 0,
    percentage: 0,
    resolvedItemCount: 0,
    unresolvedItemCount: session.objectives.length,
    finalResolutionPercent: 0,
    firstTryCorrectCount: 0,
    attemptHistory: {},
    feedback: null,
    startedAt: null,
    updatedAt: now(),
    completedAt: null,
  };
}

export function startSession(progress: BilingualSessionProgress): BilingualSessionProgress {
  const currentId = Object.keys(progress.objectiveStates)[progress.currentObjectiveIndex];
  return {
    ...progress,
    phase: "playing",
    startedAt: progress.startedAt ?? now(),
    updatedAt: now(),
    objectiveStates: currentId
      ? { ...progress.objectiveStates, [currentId]: { ...progress.objectiveStates[currentId], seen: true } }
      : progress.objectiveStates,
  };
}

export function registerAttempt(
  progress: BilingualSessionProgress,
  attempt: AnswerAttempt,
  feedbackMessage: string,
  answerLabel: string,
  totalObjectives: number,
): BilingualSessionProgress {
  const existing = progress.objectiveStates[attempt.objectiveId] ?? initialObjectiveState(attempt.objectiveId);
  const firstAttemptSuccess = attempt.correct && existing.attempts === 0;
  const needsReview = existing.needsReview || !attempt.correct;
  const updatedState: ObjectiveLearningState = {
    ...existing,
    seen: true,
    attempted: true,
    attempts: existing.attempts + 1,
    correct: existing.correct || attempt.correct,
    incorrect: existing.incorrect || !attempt.correct,
    needsReview: attempt.mode === "review" && attempt.correct ? false : needsReview,
    reinforced: existing.reinforced || (attempt.mode === "review" && attempt.correct),
    completed: existing.completed || attempt.correct,
    assisted: existing.assisted || Boolean(attempt.assisted),
  };
  const completedObjectiveIds = attempt.correct
    ? [...new Set([...progress.completedObjectiveIds, attempt.objectiveId])]
    : progress.completedObjectiveIds;
  const reviewObjectiveIds = needsReview
    ? [...new Set([...progress.reviewObjectiveIds, attempt.objectiveId])]
    : progress.reviewObjectiveIds;
  const reinforcedObjectiveIds = attempt.mode === "review" && attempt.correct
    ? [...new Set([...progress.reinforcedObjectiveIds, attempt.objectiveId])]
    : progress.reinforcedObjectiveIds;
  const scoreDelta = firstAttemptSuccess ? 100 : attempt.correct && !existing.completed ? 60 : 0;
  const score = progress.score + scoreDelta;
  const resolvedItemCount = completedObjectiveIds.length;
  const unresolvedItemCount = Math.max(0, totalObjectives - resolvedItemCount);
  const firstTryCorrectCount = Object.values({ ...progress.objectiveStates, [attempt.objectiveId]: updatedState })
    .filter((state) => state.correct && state.attempts === 1 && !state.incorrect).length;
  const attemptHistory = {
    ...(progress.attemptHistory ?? {}),
    [attempt.objectiveId]: [...(progress.attemptHistory[attempt.objectiveId] ?? []), attempt],
  };
  return {
    ...progress,
    phase: "feedback",
    completedObjectiveIds,
    reviewObjectiveIds,
    reinforcedObjectiveIds,
    objectiveStates: { ...progress.objectiveStates, [attempt.objectiveId]: updatedState },
    score,
    percentage: Math.round((score / (totalObjectives * 100)) * 100),
    resolvedItemCount,
    unresolvedItemCount,
    finalResolutionPercent: totalObjectives ? Math.round((resolvedItemCount / totalObjectives) * 100) : 0,
    firstTryCorrectCount,
    attemptHistory,
    feedback: {
      objectiveId: attempt.objectiveId,
      correct: attempt.correct,
      message: feedbackMessage,
      answerLabel,
      mode: attempt.mode ?? "session",
    },
    updatedAt: now(),
  };
}

export function continueAfterFeedback(
  progress: BilingualSessionProgress,
  session: BilingualSessionConfig,
): BilingualSessionProgress {
  const feedback = progress.feedback;
  if (!feedback) return progress;
  if (!feedback.correct) {
    return { ...progress, phase: feedback.mode === "review" ? "review" : "playing", feedback: null, updatedAt: now() };
  }
  if (feedback.mode === "review") {
    const remaining = progress.reviewObjectiveIds.filter((id) => !progress.reinforcedObjectiveIds.includes(id));
    return {
      ...progress,
      phase: remaining.length === 0 ? "result" : "review",
      feedback: null,
      updatedAt: now(),
    };
  }
  const nextIndex = progress.currentObjectiveIndex + 1;
  if (nextIndex >= session.objectives.length) {
    const completed = (progress.resolvedItemCount ?? progress.completedObjectiveIds.length) >= session.objectives.length;
    return { ...progress, phase: completed ? "result" : "playing", feedback: null, completedAt: completed ? now() : null, updatedAt: now() };
  }
  const nextObjective = session.objectives[nextIndex];
  return {
    ...progress,
    phase: "playing",
    currentObjectiveIndex: nextIndex,
    feedback: null,
    updatedAt: now(),
    objectiveStates: {
      ...progress.objectiveStates,
      [nextObjective.id]: { ...progress.objectiveStates[nextObjective.id], seen: true },
    },
  };
}

export function beginReview(progress: BilingualSessionProgress): BilingualSessionProgress {
  return { ...progress, phase: "review", feedback: null, updatedAt: now() };
}

export function showTransition(progress: BilingualSessionProgress): BilingualSessionProgress {
  return { ...progress, phase: "transition", updatedAt: now() };
}

export function markJourneySession(
  journey: BilingualJourneyProgress,
  session: BilingualSessionProgress,
): BilingualJourneyProgress {
  const finalPercent = session.finalResolutionPercent ?? Math.round((session.completedObjectiveIds.length / Math.max(1, Object.keys(session.objectiveStates).length)) * 100);
  const completed = (session.phase === "result" || session.phase === "transition") && finalPercent === 100;
  return {
    ...journey,
    activeGameId: completed ? null : session.gameId,
    sessions: { ...journey.sessions, [session.gameId]: session },
    completedGameIds: completed
      ? [...new Set([...journey.completedGameIds, session.gameId])]
      : journey.completedGameIds,
    updatedAt: now(),
  };
}

export function getReviewObjectiveIds(progress: BilingualSessionProgress) {
  return progress.reviewObjectiveIds.filter((id) => !progress.reinforcedObjectiveIds.includes(id));
}
