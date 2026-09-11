import "server-only";

export type ReviewCertificateEvent = {
  id: string;
  status: "ISSUED" | "REJECTED";
  recordedAt: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  evidenceReference?: string;
  corrected: boolean;
};

const eventsByPlayer = new Map<string, ReviewCertificateEvent[]>();

export function reviewEventsFor(playerId: string): readonly ReviewCertificateEvent[] {
  return eventsByPlayer.get(playerId) ?? [];
}

export function appendReviewEvent(playerId: string, event: ReviewCertificateEvent): void {
  const current = eventsByPlayer.get(playerId) ?? [];
  eventsByPlayer.set(playerId, [...current, event]);
}

export function reviewEventCount(): number {
  let count = 0;
  for (const events of eventsByPlayer.values()) count += events.length;
  return count;
}

export function nextReviewEventId(): string {
  return `admin-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}