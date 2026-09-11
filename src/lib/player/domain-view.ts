import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import type { PetContributionStatus, CoinLedgerStatus } from "@/generated/prisma/client";

export type { PetContributionStatus, CoinLedgerStatus } from "@/generated/prisma/client";

export interface PlayerStreakHistoryRow {
  id: string;
  clubId: string;
  clubName: string;
  periodStart: Date;
  periodEnd: Date;
  ruleVersion: string;
  components: { attendance: number | null; neurocracks: number | null; challenge: number | null; pet: number | null; validation: number | null };
  score: number | null;
  verifiedWeek: boolean | null;
  calculationStatus: string;
  calculatedAt: Date;
}

export interface PlayerEvidenceRow {
  id: string;
  type: string;
  sourceId: string;
  status: string;
  occurredAt: Date;
  validatedBy: string | null;
  validatedAt: Date | null;
  metadata: unknown;
}

export interface PlayerStreakView {
  clubName: string;
  latest: PlayerStreakHistoryRow | null;
  history: PlayerStreakHistoryRow[];
  evidence: PlayerEvidenceRow[];
}

export async function getPlayerStreakView(user: SessionUser): Promise<PlayerStreakView> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { teamId: true, team: { select: { id: true, name: true } } },
  });
  if (!membership) return { clubName: "Sin club", latest: null, history: [], evidence: [] };
  const clubId = membership.team.id;
  const clubName = membership.team.name;

  const rows = await prisma.streakPeriodResult.findMany({
    where: { playerId: user.id, clubId },
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

  const history = rows.map((row) => ({
    id: row.id,
    clubId: row.clubId,
    clubName,
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
    calculatedAt: row.calculatedAt,
  }));

  const evidence = await prisma.streakEvidence.findMany({
    where: { playerId: user.id, clubId },
    orderBy: { occurredAt: "desc" },
    take: 60,
    select: {
      id: true,
      type: true,
      sourceId: true,
      status: true,
      occurredAt: true,
      validatedBy: true,
      validatedAt: true,
      metadata: true,
    },
  });

  return {
    clubName,
    latest: history[0] ?? null,
    history,
    evidence: evidence.map((e) => ({ id: e.id, type: e.type, sourceId: e.sourceId, status: e.status, occurredAt: e.occurredAt, validatedBy: e.validatedBy, validatedAt: e.validatedAt, metadata: e.metadata })),
  };
}

export interface PlayerPetContribution {
  id: string;
  bottlesCount: number;
  estimatedKg: number | null;
  recordedAt: Date;
  status: PetContributionStatus;
  batchId: string | null;
  batchStatus: string | null;
  batchCode: string | null;
  notes: string | null;
}

export interface PlayerPetView {
  clubName: string;
  contributions: PlayerPetContribution[];
  totalBottles: number;
  totalEstimatedKg: number;
}

export async function getPlayerPetView(user: SessionUser): Promise<PlayerPetView> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { team: { select: { name: true } } },
  });
  const clubName = membership?.team.name ?? "Sin club";

  const rows = await prisma.petContribution.findMany({
    where: { playerId: user.id },
    orderBy: { recordedAt: "desc" },
    take: 120,
    select: {
      id: true,
      bottlesCount: true,
      estimatedKg: true,
      recordedAt: true,
      status: true,
      batchId: true,
      batch: { select: { status: true, batchCode: true } },
      notes: true,
    },
  });

  let totalBottles = 0;
  let totalEstimatedKg = 0;
  for (const row of rows) {
    totalBottles += row.bottlesCount;
    if (row.estimatedKg !== null) totalEstimatedKg += Number(row.estimatedKg);
  }

  return {
    clubName,
    totalBottles,
    totalEstimatedKg,
    contributions: rows.map((row) => ({
      id: row.id,
      bottlesCount: row.bottlesCount,
      estimatedKg: row.estimatedKg !== null ? Number(row.estimatedKg) : null,
      recordedAt: row.recordedAt,
      status: row.status,
      batchId: row.batchId,
      batchStatus: row.batch?.status ?? null,
      batchCode: row.batch?.batchCode ?? null,
      notes: row.notes,
    })),
  };
}

export interface PlayerCoinLedgerRow {
  id: string;
  sourceType: string;
  sourceId: string;
  coinDelta: number;
  status: CoinLedgerStatus;
  occurredAt: Date;
  notes: string | null;
  reversalOfId: string | null;
}

export interface PlayerCoinsView {
  clubName: string;
  balance: number;
  ledger: PlayerCoinLedgerRow[];
}

export async function getPlayerCoinsView(user: SessionUser): Promise<PlayerCoinsView> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { team: { select: { name: true } } },
  });
  const clubName = membership?.team.name ?? "Sin club";

  const ledger = await prisma.crackCoinLedger.findMany({
    where: { playerId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 200,
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      coinDelta: true,
      status: true,
      occurredAt: true,
      notes: true,
      reversalOfId: true,
    },
  });

  const balance = ledger.filter((l) => l.status === "POSTED").reduce((sum, l) => sum + l.coinDelta, 0);

  return {
    clubName,
    balance,
    ledger: ledger.map((l) => ({
      id: l.id,
      sourceType: l.sourceType,
      sourceId: l.sourceId,
      coinDelta: l.coinDelta,
      status: l.status,
      occurredAt: l.occurredAt,
      notes: l.notes,
      reversalOfId: l.reversalOfId,
    })),
  };
}