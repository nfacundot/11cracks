import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { assertInScope, scopesFor } from "@/lib/domain-scope";
import type { SessionUser } from "@/lib/auth";
import { calculateStreak, type StreakComponentPct, type StreakManualOverride } from "@/domain/streak/calculate-streak";
import { materializePlayerStreakEvidence, collectAttendanceFacts, collectNeurocracksFacts, type EvidenceProduceParams } from "@/lib/streak/evidence";

export interface RecalculateStreakParams {
  actor: SessionUser;
  playerId: string;
  clubId: string;
  periodStart: Date;
  periodEnd: Date;
  closePeriod: boolean;
  manualOverride?: StreakManualOverride;
}

export interface StreakPeriodResultView {
  id: string;
  playerId: string;
  clubId: string;
  periodStart: Date;
  periodEnd: Date;
  ruleVersion: string;
  components: StreakComponentPct;
  score: number | null;
  verifiedWeek: boolean | null;
  calculationStatus: "INCOMPLETE" | "PREVIEW" | "FINAL";
  reason: string | null;
  missing: (keyof StreakComponentPct)[];
  calculatedAt: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function attendanceComponent(params: EvidenceProduceParams): Promise<number | null> {
  const facts = await collectAttendanceFacts(params);
  const present = facts.length;
  const absent = await prisma.attendanceRecord.count({
    where: {
      clubId: params.clubId,
      playerId: params.playerId,
      status: "ABSENT",
      OR: [
        { markedAt: { gte: params.periodStart, lte: params.periodEnd } },
        { markedAt: null, createdAt: { gte: params.periodStart, lte: params.periodEnd } },
      ],
    },
  });
  const denominator = present + absent;
  return denominator > 0 ? round2((present / denominator) * 100) : null;
}

async function neurocracksComponent(params: EvidenceProduceParams): Promise<number | null> {
  const facts = await collectNeurocracksFacts(params);
  const assigned = await prisma.evaluationDimensionDefinition.count({
    where: { active: true, group: "NEUROCRACKS" },
  });
  if (assigned === 0) return null;
  const validated = facts.length;
  return round2((validated / assigned) * 100);
}

function weightsFromRule(rule: {
  attendanceWeight: { toNumber(): number };
  neurocracksWeight: { toNumber(): number };
  challengeWeight: { toNumber(): number };
  petWeight: { toNumber(): number };
  validationWeight: { toNumber(): number };
}): {
  attendance: number;
  neurocracks: number;
  challenge: number;
  pet: number;
  validation: number;
} {
  return {
    attendance: rule.attendanceWeight.toNumber(),
    neurocracks: rule.neurocracksWeight.toNumber(),
    challenge: rule.challengeWeight.toNumber(),
    pet: rule.petWeight.toNumber(),
    validation: rule.validationWeight.toNumber(),
  };
}

function toDecimal(value: number | null) {
  return value !== null ? value : null;
}

export async function recalculateStreakPeriodResult(params: RecalculateStreakParams): Promise<StreakPeriodResultView> {
  await assertInScope(params.actor, params.clubId, params.playerId);

  if (params.manualOverride && params.actor.role !== "ADMIN" && params.actor.role !== "SUPERADMIN") {
    throw new Error("El override manual del período solo lo puede aplicar un Admin y debe contener un motivo.");
  }
  if (params.manualOverride && !params.manualOverride.reason) {
    throw new Error("El override manual requiere un motivo auditable.");
  }

  const evidenceParams: EvidenceProduceParams = {
    playerId: params.playerId,
    clubId: params.clubId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  };

  const materialized = await materializePlayerStreakEvidence({
    actor: params.actor,
    playerId: params.playerId,
    clubId: params.clubId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
  });

  const [attendance, neurocracks] = await Promise.all([
    attendanceComponent(evidenceParams),
    neurocracksComponent(evidenceParams),
  ]);

  const rule = await prisma.streakRuleVersion.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!rule) {
    throw new Error("No existe una versión de regla de racha ACTIVE.");
  }

  const components: StreakComponentPct = {
    attendance,
    neurocracks,
    challenge: null,
    pet: null,
    validation: null,
  };

  const result = calculateStreak({
    components,
    weights: weightsFromRule(rule),
    verifiedWeekThreshold: rule.verifiedWeekThreshold !== null ? Number(rule.verifiedWeekThreshold) : null,
    closePeriod: params.closePeriod,
    manualOverride: params.manualOverride ?? null,
  });

  const sourceSummary = {
    evidence: materialized.byType,
    attendancePresent: materialized.byType.ATTENDANCE,
    neuroValidated: materialized.byType.NEUROCRACKS,
    missing: result.missing,
    overrideApplied: Boolean(params.manualOverride),
  };

  const saved = await prisma.streakPeriodResult.upsert({
    where: {
      playerId_periodStart_periodEnd_ruleVersionId: {
        playerId: params.playerId,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        ruleVersionId: rule.id,
      },
    },
    update: {
      clubId: params.clubId,
      attendanceComponent: toDecimal(result.components.attendance),
      neurocracksComponent: toDecimal(result.components.neurocracks),
      challengeComponent: toDecimal(result.components.challenge),
      petComponent: toDecimal(result.components.pet),
      validationComponent: toDecimal(result.components.validation),
      streakScore: toDecimal(result.score),
      verifiedWeek: result.verifiedWeek,
      calculationStatus: result.calculationStatus,
      sourceSummary,
      manualOverride: params.manualOverride ? { ...params.manualOverride, appliedBy: params.actor.id } : Prisma.DbNull,
      calculatedAt: new Date(),
    },
    create: {
      clubId: params.clubId,
      playerId: params.playerId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      ruleVersionId: rule.id,
      attendanceComponent: toDecimal(result.components.attendance),
      neurocracksComponent: toDecimal(result.components.neurocracks),
      challengeComponent: toDecimal(result.components.challenge),
      petComponent: toDecimal(result.components.pet),
      validationComponent: toDecimal(result.components.validation),
      streakScore: toDecimal(result.score),
      verifiedWeek: result.verifiedWeek,
      calculationStatus: result.calculationStatus,
      sourceSummary,
      manualOverride: params.manualOverride ? { ...params.manualOverride, appliedBy: params.actor.id } : Prisma.DbNull,
    },
  });

  return {
    id: saved.id,
    playerId: saved.playerId,
    clubId: saved.clubId,
    periodStart: saved.periodStart,
    periodEnd: saved.periodEnd,
    ruleVersion: rule.version,
    components: {
      attendance: saved.attendanceComponent !== null ? Number(saved.attendanceComponent) : null,
      neurocracks: saved.neurocracksComponent !== null ? Number(saved.neurocracksComponent) : null,
      challenge: saved.challengeComponent !== null ? Number(saved.challengeComponent) : null,
      pet: saved.petComponent !== null ? Number(saved.petComponent) : null,
      validation: saved.validationComponent !== null ? Number(saved.validationComponent) : null,
    },
    score: saved.streakScore !== null ? Number(saved.streakScore) : null,
    verifiedWeek: saved.verifiedWeek,
    calculationStatus: saved.calculationStatus,
    reason: result.reason,
    missing: result.missing,
    calculatedAt: saved.calculatedAt,
  };
}

export interface StreakWorkspacePlayer {
  id: string;
  name: string;
  latest: StreakPeriodResultView | null;
}

export interface StreakWorkspace {
  scopes: { clubId: string; clubName: string; players: StreakWorkspacePlayer[] }[];
}

export async function getStreakWorkspace(user: SessionUser): Promise<StreakWorkspace> {
  const scopes = await scopesFor(user);
  const playerIds = [...new Set(scopes.flatMap((scope) => scope.playerIds))];
  const players = playerIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } })
    : [];
  const userName = new Map(players.map((player) => [player.id, player.name]));

  const results = playerIds.length > 0
    ? await prisma.streakPeriodResult.findMany({
        where: { playerId: { in: playerIds } },
        orderBy: { periodEnd: "desc" },
        select: {
          id: true,
          playerId: true,
          clubId: true,
          periodStart: true,
          periodEnd: true,
          attendanceComponent: true,
          neurocracksComponent: true,
          challengeComponent: true,
          petComponent: true,
          validationComponent: true,
          streakScore: true,
          verifiedWeek: true,
          calculationStatus: true,
          calculatedAt: true,
          ruleVersion: { select: { version: true } },
        },
      })
    : [];

  const latestByPlayer = new Map<string, StreakPeriodResultView>();
  for (const row of results) {
    if (!latestByPlayer.has(row.playerId)) {
      latestByPlayer.set(row.playerId, {
        id: row.id,
        playerId: row.playerId,
        clubId: row.clubId,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        ruleVersion: row.ruleVersion.version,
        components: {
          attendance: row.attendanceComponent !== null ? Number(row.attendanceComponent) : null,
          neurocracks: row.neurocracksComponent !== null ? Number(row.neurocracksComponent) : null,
          challenge: row.challengeComponent !== null ? Number(row.challengeComponent) : null,
          pet: row.petComponent !== null ? Number(row.petComponent) : null,
          validation: row.validationComponent !== null ? Number(row.validationComponent) : null,
        },
        score: row.streakScore !== null ? Number(row.streakScore) : null,
        verifiedWeek: row.verifiedWeek,
        calculationStatus: row.calculationStatus,
        reason: null,
        missing: [],
        calculatedAt: row.calculatedAt,
      });
    }
  }

  return {
    scopes: scopes.map((scope) => ({
      clubId: scope.clubId,
      clubName: scope.clubName,
      players: scope.playerIds
        .map((playerId) => ({
          id: playerId,
          name: userName.get(playerId) ?? "Sin nombre",
          latest: latestByPlayer.get(playerId) ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })),
  };
}

export function closePeriodCurrentWeek(): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const start = new Date(now);
  const day = (now.getDay() + 6) % 7;
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { periodStart: start, periodEnd: end };
}

export async function getPlayerStreakResults(params: {
  playerId: string;
  clubId: string;
}): Promise<StreakPeriodResultView[]> {
  const rows = await prisma.streakPeriodResult.findMany({
    where: { playerId: params.playerId, clubId: params.clubId },
    orderBy: { periodEnd: "desc" },
    take: 100,
    select: {
      id: true,
      playerId: true,
      clubId: true,
      periodStart: true,
      periodEnd: true,
      attendanceComponent: true,
      neurocracksComponent: true,
      challengeComponent: true,
      petComponent: true,
      validationComponent: true,
      streakScore: true,
      verifiedWeek: true,
      calculationStatus: true,
      calculatedAt: true,
      ruleVersion: { select: { version: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    playerId: row.playerId,
    clubId: row.clubId,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    ruleVersion: row.ruleVersion.version,
    components: {
      attendance: row.attendanceComponent !== null ? Number(row.attendanceComponent) : null,
      neurocracks: row.neurocracksComponent !== null ? Number(row.neurocracksComponent) : null,
      challenge: row.challengeComponent !== null ? Number(row.challengeComponent) : null,
      pet: row.petComponent !== null ? Number(row.petComponent) : null,
      validation: row.validationComponent !== null ? Number(row.validationComponent) : null,
    },
    score: row.streakScore !== null ? Number(row.streakScore) : null,
    verifiedWeek: row.verifiedWeek,
    calculationStatus: row.calculationStatus,
    reason: null,
    missing: [],
    calculatedAt: row.calculatedAt,
  }));
}