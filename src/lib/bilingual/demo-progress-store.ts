"use client";

import type { BilingualJourneyProgress, BilingualSessionConfig, TargetLanguage } from "./game-contracts";
import { createJourneyProgress, createSessionProgress } from "./session-engine";

const keyFor = (playerId: string) => `11cracks:bilinguismo:phase03b:${playerId}`;

export function readDemoBilingualProgress(playerId: string): BilingualJourneyProgress {
  if (typeof window === "undefined") return createJourneyProgress(playerId);
  const raw = window.localStorage.getItem(keyFor(playerId));
  if (!raw) return createJourneyProgress(playerId);
  try {
    const parsed = JSON.parse(raw) as BilingualJourneyProgress;
    return parsed.version === 1 && parsed.playerId === playerId && (parsed.targetLanguage === "en" || parsed.targetLanguage === "pt") ? parsed : createJourneyProgress(playerId);
  } catch {
    return createJourneyProgress(playerId);
  }
}

export function writeDemoBilingualProgress(progress: BilingualJourneyProgress) {
  window.localStorage.setItem(keyFor(progress.playerId), JSON.stringify(progress));
}

export function clearDemoBilingualProgress(playerId: string) {
  window.localStorage.removeItem(keyFor(playerId));
}

export function resetDemoGameSession(playerId: string, session: BilingualSessionConfig): BilingualJourneyProgress {
  const journey = readDemoBilingualProgress(playerId);
  const nextSession = createSessionProgress(session);
  const next: BilingualJourneyProgress = {
    ...journey,
    targetLanguage: session.targetLanguage,
    sessions: { ...journey.sessions, [session.gameId]: nextSession },
    activeGameId: session.gameId,
    completedGameIds: journey.completedGameIds.filter((id) => id !== session.gameId),
    updatedAt: new Date().toISOString(),
  };
  writeDemoBilingualProgress(next);
  return next;
}

export function setDemoBilingualLanguage(playerId: string, targetLanguage: TargetLanguage): BilingualJourneyProgress {
  const journey = readDemoBilingualProgress(playerId);
  const sameLanguage = journey.targetLanguage === targetLanguage;
  const sessions = sameLanguage
    ? journey.sessions
    : Object.fromEntries(Object.entries(journey.sessions).filter(([, session]) => session.targetLanguage === targetLanguage));
  const completedGameIds = sameLanguage
    ? journey.completedGameIds
    : journey.completedGameIds.filter((gameId) => sessions[gameId]);
  const next: BilingualJourneyProgress = {
    ...journey,
    targetLanguage,
    sessions,
    completedGameIds,
    activeGameId: sameLanguage ? journey.activeGameId : null,
    updatedAt: new Date().toISOString(),
  };
  writeDemoBilingualProgress(next);
  return next;
}

export function resetDemoBilingualProgress(playerId: string): BilingualJourneyProgress {
  const next = createJourneyProgress(playerId);
  writeDemoBilingualProgress(next);
  return next;
}
