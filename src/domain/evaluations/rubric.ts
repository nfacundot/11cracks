export const RUBRIC_LEVELS = [
  "NOT_OBSERVED",
  "NEEDS_SUPPORT",
  "IN_DEVELOPMENT",
  "ADEQUATE",
  "OUTSTANDING",
  "CONSOLIDATED",
] as const;

export type RubricLevel = (typeof RUBRIC_LEVELS)[number];

export const RUBRIC_NORMALIZED: Record<RubricLevel, number | null> = {
  NOT_OBSERVED: null,
  NEEDS_SUPPORT: 20,
  IN_DEVELOPMENT: 40,
  ADEQUATE: 60,
  OUTSTANDING: 80,
  CONSOLIDATED: 100,
};

export function normalizeRubric(level: RubricLevel): number | null {
  return RUBRIC_NORMALIZED[level];
}

export function isRubricLevel(value: string): value is RubricLevel {
  return (RUBRIC_LEVELS as readonly string[]).includes(value);
}