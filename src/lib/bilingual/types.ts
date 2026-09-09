export type LanguageCode = "en" | "pt";
export type LearningContextId = "sport" | "gastronomia_sport";
export type ExperienceType = "game_series" | "ai_practice";
export type EvaluationMode = "learning_evidence" | "practice_only";

export interface LanguageDescriptor {
  id: LanguageCode;
  label: string;
}

export interface LearningContextDescriptor {
  id: LearningContextId;
  label: string;
}

export interface LearningExperienceDescriptor {
  id: string;
  label: string;
  experienceType: ExperienceType;
  languages: readonly LanguageCode[];
  contexts: readonly LearningContextId[];
  contentSet: string;
  capabilities: readonly string[];
  evaluationMode: EvaluationMode;
  contentVersion: string;
}
