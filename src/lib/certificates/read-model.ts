import "server-only";

import { prisma } from "@/lib/prisma";
import { PLAYER_CERTIFICATION_TARGET_HOURS } from "@/lib/player/progress";
import { reviewEventsFor, reviewEventCount } from "@/lib/certificates/review-store";

export type CertificateStatus = "IN_PROGRESS" | "ELIGIBLE" | "ISSUED" | "REJECTED";

export interface CertificateSourceFact {
  id: string;
  source: string;
  sessionLabel?: string;
  hours: number;
  state: string;
  effectiveAt: string;
  actor: string;
  validator?: string;
  context?: string;
}

export interface CertificateHistoryEntry {
  id: string;
  status: "ISSUED" | "REJECTED";
  recordedAt: string;
  actor: string;
  actorRole?: string;
  reason?: string;
  evidenceReference?: string;
  corrected: boolean;
}

export interface CertificateRecord {
  id: string;
  clubId?: string;
  teamId?: string;
  playerId: string;
  playerName: string;
  clubName: string;
  registeredHours?: number;
  validatedHours?: number;
  pendingHours?: number;
  requiredHours: number;
  remainingHours?: number;
  eligible: boolean;
  status: CertificateStatus;
  currentEventId?: string;
  sourceFacts: readonly CertificateSourceFact[];
  history: readonly CertificateHistoryEntry[];
}

export interface CertificateOperationsView {
  targetHours: number;
  certificates: readonly CertificateRecord[];
  auditCount: number;
}

function factHours(timeSeconds: number | null | undefined): number {
  if (!timeSeconds || timeSeconds <= 0) return 1;
  return Math.max(1, Math.round((timeSeconds / 3600) * 100) / 100);
}

export async function getCertificateOperationsView(): Promise<CertificateOperationsView> {
  const members = await prisma.teamMember.findMany({
    select: {
      userId: true,
      role: true,
      team: { select: { id: true, name: true } },
    },
  });

  const memberByUser = new Map<string, { clubId?: string; teamId: string; teamName: string }>();
  for (const member of members) {
    if (!memberByUser.has(member.userId)) {
      memberByUser.set(member.userId, {
        clubId: member.role === "PLAYER" ? member.team.id : undefined,
        teamId: member.team.id,
        teamName: member.team.name,
      });
    }
  }

  const players = await prisma.user.findMany({
    where: { role: "JUGADOR" },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  const ids = players.map((player) => player.id);

  const [lessons, sessions] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: { in: ids }, completed: true },
      select: {
        userId: true,
        completedAt: true,
        lesson: { select: { id: true, title: true, timeSeconds: true } },
      },
    }),
    prisma.gameSession.findMany({
      where: { userId: { in: ids } },
      select: { id: true, userId: true, gameType: true, details: true, createdAt: true },
    }),
  ]);

  const revisionEvents = reviewEventsFor;

  const certificates: CertificateRecord[] = players.map((player): CertificateRecord => {
    const scope = memberByUser.get(player.id);
    const playerLessons = lessons.filter((item) => item.userId === player.id);
    const playerSessions = sessions.filter((item) => item.userId === player.id);

    const lessonFacts: CertificateSourceFact[] = playerLessons.map((item) => ({
      id: `lesson:${item.lesson.id}`,
      source: "learn · lecciones",
      sessionLabel: item.lesson.title,
      hours: factHours(item.lesson.timeSeconds),
      state: "VALIDATED",
      effectiveAt: item.completedAt?.toISOString() ?? new Date().toISOString(),
      actor: player.name,
      validator: "Auto · lección completada",
      context: "Lección del catálogo completada",
    }));

    const sessionFacts: CertificateSourceFact[] = playerSessions.map((item) => ({
      id: `session:${item.id}`,
      source: "play · sesiones de juego",
      sessionLabel: item.gameType,
      hours: 0.5,
      state: "PENDING",
      effectiveAt: item.createdAt.toISOString(),
      actor: player.name,
      validator: undefined,
      context: typeof item.details === "object" && item.details !== null && "context" in item.details ? String((item.details as { context?: unknown }).context) : undefined,
    }));

    const sourceFacts = [...lessonFacts, ...sessionFacts];
    const registered = sourceFacts.reduce((sum, fact) => sum + fact.hours, 0);
    const validated = lessonFacts.reduce((sum, fact) => sum + fact.hours, 0);
    const pending = Math.max(0, registered - validated);
    const remainingHours = Math.max(0, PLAYER_CERTIFICATION_TARGET_HOURS - validated);
    const eligible = validated >= PLAYER_CERTIFICATION_TARGET_HOURS;

    const history: CertificateHistoryEntry[] = revisionEvents(player.id).map((event) => ({
      id: event.id,
      status: event.status,
      recordedAt: event.recordedAt,
      actor: event.actor,
      actorRole: event.actorRole,
      reason: event.reason,
      evidenceReference: event.evidenceReference,
      corrected: event.corrected,
    }));
    const lastEvent = history[0] ?? undefined;
    const status: CertificateStatus = lastEvent ? lastEvent.status : eligible ? "ELIGIBLE" : "IN_PROGRESS";

    return {
      id: `certificate:${player.id}`,
      clubId: scope?.clubId,
      teamId: scope?.teamId,
      playerId: player.id,
      playerName: player.name,
      clubName: scope?.teamName ?? "Sin club",
      registeredHours: registered,
      validatedHours: validated,
      pendingHours: pending,
      requiredHours: PLAYER_CERTIFICATION_TARGET_HOURS,
      remainingHours,
      eligible,
      status,
      currentEventId: lastEvent?.id,
      sourceFacts,
      history,
    };
  });

  return {
    targetHours: PLAYER_CERTIFICATION_TARGET_HOURS,
    certificates,
    auditCount: reviewEventCount(),
  };
}