export type BilingualGameId = "oido-de-crack" | "gol-de-palabra" | "letras-de-crack" | "alimentacion";

export type BilingualGamePhase =
  | "intro"
  | "playing"
  | "feedback"
  | "result"
  | "review"
  | "transition";

export type GameAccent = "cyan" | "lime" | "violet";
export type TargetLanguage = "en" | "pt";
export type SpeechLocale =
  | "es-ES"
  | "en-US"
  | "pt-BR"
  | "fr-FR"
  | "it-IT"
  | "de-DE"
  | "ar-SA"
  | "hi-IN"
  | "ja-JP"
  | "ko-KR"
  | "zh-CN"
  | "nl-NL"
  | "ru-RU"
  | "pl-PL"
  | "tr-TR"
  | "sv-SE"
  | "da-DK"
  | "fi-FI";

export interface SpeechAudioReference {
  kind: "speech";
  text: string;
  targetLanguage: TargetLanguage;
  language: SpeechLocale;
  audioSrc?: string;
}

export interface VisualOption {
  id: string;
  label: string;
  asset: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export interface ResponsiveEnvironmentScene {
  src: string;
  mobileSrc?: string;
  alt: string;
  focalPoint: string;
  crops?: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  safeInteractionArea?: "center-stage" | "lower-stage";
  protectedVisualArea?: "right-tunnel" | "center-goal" | "food-station";
}

interface ObjectiveBase {
  id: string;
  target: string;
  targetLanguage: TargetLanguage;
  audio: SpeechAudioReference;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface ListeningObjective extends ObjectiveBase {
  mechanic: "visual-choice";
  options: readonly VisualOption[];
  correctAnswerId: string;
}

export interface MeaningObjective extends ObjectiveBase {
  mechanic: "meaning-choice";
  options: readonly { id: string; label: string }[];
  correctAnswerId: string;
}

export interface LetterObjective extends ObjectiveBase {
  mechanic: "letter-build";
  prompt: string;
  meaning: string;
  visualAsset: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  availableLetters: readonly string[];
  correctOrder: string;
}

export type BilingualObjective = ListeningObjective | MeaningObjective | LetterObjective;

export interface BilingualSessionConfig<TObjective extends BilingualObjective = BilingualObjective> {
  id: string;
  gameId: BilingualGameId;
  environmentId: string;
  environmentLabel: string;
  title: string;
  targetLanguage: TargetLanguage;
  scene: ResponsiveEnvironmentScene;
  objectives: readonly TObjective[];
}

export interface BilingualGameConfig<TObjective extends BilingualObjective = BilingualObjective> {
  id: BilingualGameId;
  label: string;
  shortLabel: string;
  description: string;
  mechanicLine: string;
  support: string;
  accent: GameAccent;
  session: BilingualSessionConfig<TObjective>;
}

export interface ObjectiveLearningState {
  objectiveId: string;
  seen: boolean;
  attempted: boolean;
  attempts: number;
  correct: boolean;
  incorrect: boolean;
  needsReview: boolean;
  reinforced: boolean;
  completed: boolean;
  assisted: boolean;
}

export interface GameFeedbackState {
  objectiveId: string;
  correct: boolean;
  message: string;
  answerLabel: string;
  mode: "session" | "review";
}

export interface BilingualSessionProgress {
  gameId: BilingualGameId;
  environmentId: string;
  sessionId: string;
  targetLanguage: TargetLanguage;
  phase: BilingualGamePhase;
  currentObjectiveIndex: number;
  completedObjectiveIds: string[];
  reviewObjectiveIds: string[];
  reinforcedObjectiveIds: string[];
  objectiveStates: Record<string, ObjectiveLearningState>;
  score: number;
  percentage: number;
  /** Final resolution is the unlock metric; score remains pedagogical feedback. */
  resolvedItemCount: number;
  unresolvedItemCount: number;
  finalResolutionPercent: number;
  firstTryCorrectCount: number;
  attemptHistory: Record<string, AnswerAttempt[]>;
  feedback: GameFeedbackState | null;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
}

export interface BilingualJourneyProgress {
  version: 1;
  playerId: string;
  targetLanguage: TargetLanguage;
  sessions: Partial<Record<BilingualGameId, BilingualSessionProgress>>;
  activeGameId: BilingualGameId | null;
  completedGameIds: BilingualGameId[];
  updatedAt: string;
}

export interface AnswerAttempt {
  objectiveId: string;
  answer: string;
  correct: boolean;
  assisted?: boolean;
  mode?: "session" | "review";
}
