import type { LanguageRequirementProgress } from "./learning-gate";
import type { TargetLanguage } from "./game-contracts";

export type LearningMissionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type LearningGameStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type CoachReadinessStatus = "READY" | "IN_PROGRESS" | "PENDING" | "NO_MISSION";

export interface LearningScheduleBlockView {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
  status: "LOCKED" | "UNLOCKED";
  unlockedAt: string | null;
}

export interface LearningGameProgressView {
  activityId: string;
  gameId: string;
  language: TargetLanguage;
  status: LearningGameStatus;
  totalRequiredItems: number;
  resolvedItemCount: number;
  unresolvedItemCount: number;
  finalResolutionPercent: number;
  firstTryCorrectCount: number;
  reinforcementCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PlayerLearningMissionView {
  id: string;
  playerId: string;
  status: LearningMissionStatus;
  requiredCompletedActivityCount: number;
  assignedActivityIds: readonly string[];
  completedActivityCount: number;
  startedAt: string | null;
  completedAt: string | null;
  schedule: LearningScheduleBlockView;
  activities: readonly LearningGameProgressView[];
  languageProgress: readonly LanguageRequirementProgress[];
}

export interface CoachLearningReadinessView {
  playerId: string;
  playerName: string;
  teamLabel: string;
  category: string;
  status: CoachReadinessStatus;
  completedActivityCount: number;
  requiredActivityCount: number;
  currentProgress: string;
  scheduleState: "LOCKED" | "UNLOCKED" | "NO_MISSION";
  missionId: string | null;
  detail: PlayerLearningMissionView | null;
}

export function activityIdForGame(gameId: string, language: TargetLanguage): string {
  return `${gameId}:${language}`;
}