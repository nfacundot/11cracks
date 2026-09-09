import { getBilingualGames } from "./demo-content";
import type { BilingualGameId, TargetLanguage } from "./game-contracts";

export const REQUIRED_LANGUAGE_ACTIVITIES = 3;

export interface LanguageRequirementProgress {
  language: TargetLanguage;
  label: "English" | "Português";
  completedActivities: number;
  requiredActivities: number;
  completedGameIds: readonly BilingualGameId[];
  nextGameId: BilingualGameId | null;
}

export interface LearningEventForGate {
  gameId: string;
  language: TargetLanguage;
  objectiveId: string;
  learningState: string;
  attempts: number;
  occurredAt: string;
}

export interface LearningScheduleGateInput {
  missionCompleted: boolean;
  englishCompletedActivities: number;
  portugueseCompletedActivities: number;
  scheduleStatus: "LOCKED" | "UNLOCKED";
}

export interface LearningScheduleGate {
  missionCompleted: boolean;
  languageRequirementCompleted: boolean;
  requirementsCompleted: boolean;
  scheduleAccessUnlocked: boolean;
  waitingForCoachPublication: boolean;
}

const resolvedStates = new Set(["PRACTICADO", "APRENDIDA"]);

export function resolveLanguageRequirementProgress(events: readonly LearningEventForGate[]): readonly LanguageRequirementProgress[] {
  const latest = new Map<string, LearningEventForGate>();
  for (const event of events) {
    const key = `${event.language}:${event.gameId}:${event.objectiveId}`;
    const previous = latest.get(key);
    if (!previous || event.attempts > previous.attempts || (event.attempts === previous.attempts && event.occurredAt >= previous.occurredAt)) latest.set(key, event);
  }

  return (["en", "pt"] as const).map((language) => {
    const games = getBilingualGames(language);
    const completedGameIds = games.filter((game) => game.session.objectives.every((objective) => resolvedStates.has(latest.get(`${language}:${game.id}:${objective.id}`)?.learningState ?? ""))).map((game) => game.id);
    const nextGameId = games.find((game) => !completedGameIds.includes(game.id))?.id ?? null;
    return { language, label: language === "en" ? "English" : "Português", completedActivities: completedGameIds.length, requiredActivities: games.length || REQUIRED_LANGUAGE_ACTIVITIES, completedGameIds, nextGameId };
  });
}

export function resolveLearningScheduleGate(input: LearningScheduleGateInput): LearningScheduleGate {
  const languageRequirementCompleted = Math.max(input.englishCompletedActivities, input.portugueseCompletedActivities) >= REQUIRED_LANGUAGE_ACTIVITIES;
  const requirementsCompleted = input.missionCompleted && languageRequirementCompleted;
  return { missionCompleted: input.missionCompleted, languageRequirementCompleted, requirementsCompleted, scheduleAccessUnlocked: requirementsCompleted && input.scheduleStatus === "UNLOCKED", waitingForCoachPublication: requirementsCompleted && input.scheduleStatus === "LOCKED" };
}
