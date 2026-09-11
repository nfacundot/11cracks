import { DEFAULT_ELEVEN_WEIGHTS } from "@/config/domain-rules";

export interface SportDimensionInput {
  key: string;
  rubric: number | null;
}

export interface NeuroDimensionInput {
  key: string;
  coach: number | null;
  digital: number | null;
}

export interface ElevenScoreWeights {
  sport: number;
  neuro: number;
}

export interface SportDimensionResult {
  key: string;
  normalized: number | null;
}

export interface NeuroDimensionResult {
  key: string;
  coach: number | null;
  digital: number | null;
  combined: number | null;
}

export interface ElevenScoreResult {
  calculationStatus: "INCOMPLETE" | "FINAL";
  sportScore: number | null;
  neuroScore: number | null;
  elevenScore: number | null;
  sport: SportDimensionResult[];
  neuro: NeuroDimensionResult[];
  missing: { sport: string[]; neuro: string[] };
}

export interface CalculateElevenScoreInput {
  sport: SportDimensionInput[];
  neuro: NeuroDimensionInput[];
  weights?: ElevenScoreWeights;
}

function averageObserved(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

export function calculateElevenScore(input: CalculateElevenScoreInput): ElevenScoreResult {
  const weights = input.weights ?? DEFAULT_ELEVEN_WEIGHTS;

  const sportResults: SportDimensionResult[] = input.sport.map((item) => ({
    key: item.key,
    normalized: item.rubric,
  }));
  const observedSport = sportResults.filter((item) => item.normalized !== null).map((item) => item.normalized as number);
  const sportScore = averageObserved(observedSport);

  const neuroResults: NeuroDimensionResult[] = input.neuro.map((item) => {
    const combined = item.coach !== null && item.digital !== null
      ? Math.round((item.coach * 0.5 + item.digital * 0.5) * 100) / 100
      : null;
    return {
      key: item.key,
      coach: item.coach,
      digital: item.digital,
      combined,
    };
  });
  const observedNeuro = neuroResults.filter((item) => item.combined !== null).map((item) => item.combined as number);
  const neuroScore = averageObserved(observedNeuro);

  const elevenScore = sportScore !== null && neuroScore !== null
    ? Math.round((sportScore * weights.sport + neuroScore * weights.neuro) * 100) / 100
    : null;

  return {
    calculationStatus: elevenScore !== null ? "FINAL" : "INCOMPLETE",
    sportScore,
    neuroScore,
    elevenScore,
    sport: sportResults,
    neuro: neuroResults,
    missing: {
      sport: sportResults.filter((item) => item.normalized === null).map((item) => item.key),
      neuro: neuroResults.filter((item) => item.combined === null).map((item) => item.key),
    },
  };
}