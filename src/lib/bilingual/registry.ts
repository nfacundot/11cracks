import type {
  LanguageDescriptor,
  LearningContextDescriptor,
  LearningExperienceDescriptor,
} from "./types";

export const activeLanguages = [
  { id: "en", label: "English" },
  { id: "pt", label: "Português" },
] as const satisfies readonly LanguageDescriptor[];

export const activeLearningContexts = [
  { id: "sport", label: "Deporte" },
  { id: "gastronomia_sport", label: "Gastronomía Sport" },
] as const satisfies readonly LearningContextDescriptor[];

export const activeLearningExperiences = [
  {
    id: "oido-de-crack",
    label: "Oído de Crack",
    experienceType: "game_series",
    languages: ["en", "pt"],
    contexts: ["sport", "gastronomia_sport"],
    contentSet: "bilinguismo-sport-mvp",
    capabilities: ["target-language-audio", "environment-object-selection"],
    evaluationMode: "learning_evidence",
    contentVersion: "1.0",
  },
  {
    id: "gol-de-palabra",
    label: "Gol de Palabra",
    experienceType: "game_series",
    languages: ["en", "pt"],
    contexts: ["sport", "gastronomia_sport"],
    contentSet: "bilinguismo-sport-mvp",
    capabilities: ["target-language-audio", "meaning-selection", "football-outcome"],
    evaluationMode: "learning_evidence",
    contentVersion: "1.0",
  },
  {
    id: "letras-de-crack",
    label: "Letras de Crack",
    experienceType: "game_series",
    languages: ["en", "pt"],
    contexts: ["sport", "gastronomia_sport"],
    contentSet: "bilinguismo-sport-mvp",
    capabilities: ["word-construction", "assisted-state"],
    evaluationMode: "learning_evidence",
    contentVersion: "1.0",
  },
  {
    id: "entrena-con-ia",
    label: "Entrena con IA",
    experienceType: "ai_practice",
    languages: ["en", "pt"],
    contexts: ["sport", "gastronomia_sport"],
    contentSet: "bilinguismo-sport-ai-practice-mvp",
    capabilities: ["ai-audio-output", "subtitles", "selectable-response", "typed-response"],
    evaluationMode: "practice_only",
    contentVersion: "1.0",
  },
] as const satisfies readonly LearningExperienceDescriptor[];
