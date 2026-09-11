export const STREAK_EVIDENCE_TYPES = ["ATTENDANCE", "NEUROCRACKS", "CHALLENGE", "PET", "VALIDATION"] as const;
export type StreakEvidenceType = (typeof STREAK_EVIDENCE_TYPES)[number];

export const STREAK_EVIDENCE_STATUSES = ["PENDING", "VERIFIED", "REJECTED", "REVERSED"] as const;
export type StreakEvidenceStatus = (typeof STREAK_EVIDENCE_STATUSES)[number];

export function isStreakEvidenceType(value: string): value is StreakEvidenceType {
  return (STREAK_EVIDENCE_TYPES as readonly string[]).includes(value);
}

export function isStreakEvidenceStatus(value: string): value is StreakEvidenceStatus {
  return (STREAK_EVIDENCE_STATUSES as readonly string[]).includes(value);
}

export function evidenceKey(type: StreakEvidenceType, sourceId: string): string {
  return `${type}:${sourceId}`;
}