import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { assertInScope } from "@/lib/domain-scope";
import type { SessionUser } from "@/lib/auth";
import {
  evidenceKey,
  type StreakEvidenceStatus,
  type StreakEvidenceType,
} from "@/domain/streak/evidence-contract";

export interface StreakEvidenceFact {
  playerId: string;
  sessionId: string | null;
  type: StreakEvidenceType;
  sourceId: string;
  status: StreakEvidenceStatus;
  occurredAt: Date;
  validatedBy: string | null;
  validatedAt: Date | null;
  metadata: Prisma.InputJsonValue;
}

export interface EvidenceProduceParams {
  playerId: string;
  clubId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface EvidenceMaterializeResult {
  playerId: string;
  byType: Record<StreakEvidenceType, number>;
  total: number;
  duplicated: number;
}

export interface EvidenceRow {
  id: string;
  type: StreakEvidenceType;
  sourceId: string;
  status: StreakEvidenceStatus;
  occurredAt: Date;
  validatedBy: string | null;
  validatedAt: Date | null;
  metadata: unknown;
  idempotencyKey: string;
}

type EvidenceProducer = (params: EvidenceProduceParams) => Promise<StreakEvidenceFact[]>;

function onlyPlayer(playerId: string) {
  return (fact: StreakEvidenceFact): boolean => fact.playerId === playerId;
}

export async function collectAttendanceFacts(params: EvidenceProduceParams): Promise<StreakEvidenceFact[]> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      clubId: params.clubId,
      playerId: params.playerId,
      status: "PRESENT",
    },
    select: { id: true, sessionId: true, markedAt: true, createdAt: true, coachId: true },
  });
  return records
    .map((record) => ({
      playerId: params.playerId,
      sessionId: record.sessionId,
      type: "ATTENDANCE" as const,
      sourceId: record.id,
      status: "VERIFIED" as const,
      occurredAt: record.markedAt ?? record.createdAt,
      validatedBy: record.coachId,
      validatedAt: record.markedAt ?? record.createdAt,
      metadata: { sessionId: record.sessionId },
    }))
    .filter((fact) => fact.occurredAt >= params.periodStart && fact.occurredAt <= params.periodEnd);
}

export async function collectNeurocracksFacts(params: EvidenceProduceParams): Promise<StreakEvidenceFact[]> {
  const scores = await prisma.neuroDigitalPeriodScore.findMany({
    where: {
      clubId: params.clubId,
      playerId: params.playerId,
      periodStart: { gte: params.periodStart },
      periodEnd: { lte: params.periodEnd },
    },
    select: { id: true, dimensionId: true, ruleVersion: true, score: true, calculatedAt: true },
  });
  return scores.map((score) => ({
    playerId: params.playerId,
    sessionId: null,
    type: "NEUROCRACKS" as const,
    sourceId: score.id,
    status: "VERIFIED" as const,
    occurredAt: score.calculatedAt,
    validatedBy: null,
    validatedAt: score.calculatedAt,
    metadata: { dimensionId: score.dimensionId, ruleVersion: score.ruleVersion, score: Number(score.score) },
  }));
}

export async function collectPetFacts(params: EvidenceProduceParams): Promise<StreakEvidenceFact[]> {
  const contributions = await prisma.petContribution.findMany({
    where: {
      clubId: params.clubId,
      playerId: params.playerId,
      status: "IN_BATCH",
    },
    select: {
      id: true,
      recordedAt: true,
      bottlesCount: true,
      batchId: true,
      batch: {
        select: { status: true, receivedAt: true, closedAt: true, closedBy: true, realKg: true },
      },
    },
  });
  return contributions
    .filter((contribution) => contribution.batch && ["WEIGHED", "SETTLED", "RECONCILED"].includes(contribution.batch!.status))
    .map((contribution) => {
      const batch = contribution.batch!;
      const occurredAt = batch.receivedAt ?? batch.closedAt ?? contribution.recordedAt;
      return {
        playerId: params.playerId,
        sessionId: null,
        type: "PET" as const,
        sourceId: contribution.id,
        status: "VERIFIED" as const,
        occurredAt,
        validatedBy: batch.closedBy,
        validatedAt: batch.closedAt ?? batch.receivedAt ?? null,
        metadata: {
          batchId: contribution.batchId ?? null,
          realKg: batch.realKg !== null && batch.realKg !== undefined ? Number(batch.realKg) : null,
          batchStatus: batch.status,
        },
      };
    })
    .filter((fact) => fact.occurredAt >= params.periodStart && fact.occurredAt <= params.periodEnd);
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function collectChallengeFacts(_params: EvidenceProduceParams): Promise<StreakEvidenceFact[]> {
  return [];
}

export async function collectValidationFacts(_params: EvidenceProduceParams): Promise<StreakEvidenceFact[]> {
  return [];
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const STREAK_PRODUCERS: EvidenceProducer[] = [
  collectAttendanceFacts,
  collectNeurocracksFacts,
  collectPetFacts,
  collectChallengeFacts,
  collectValidationFacts,
];

export async function materializePlayerStreakEvidence(params: {
  actor: SessionUser;
  playerId: string;
  clubId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<EvidenceMaterializeResult> {
  await assertInScope(params.actor, params.clubId, params.playerId);

  const facts = (
    await Promise.all(STREAK_PRODUCERS.map((producer) => producer(params)))
  ).flat().filter(onlyPlayer(params.playerId));

  const byType: Record<StreakEvidenceType, number> = {
    ATTENDANCE: 0,
    NEUROCRACKS: 0,
    CHALLENGE: 0,
    PET: 0,
    VALIDATION: 0,
  };
  for (const fact of facts) {
    byType[fact.type] += 1;
  }

  const keys = facts.map((fact) => evidenceKey(fact.type, fact.sourceId));
  const existing = keys.length > 0
    ? await prisma.streakEvidence.findMany({
        where: { idempotencyKey: { in: keys } },
        select: { idempotencyKey: true },
      })
    : [];
  const known = new Set(existing.map((row) => row.idempotencyKey));
  const duplicated = keys.filter((key) => known.has(key)).length;

  for (const fact of facts) {
    const key = evidenceKey(fact.type, fact.sourceId);
    await prisma.streakEvidence.upsert({
      where: { idempotencyKey: key },
      update: {
        clubId: params.clubId,
        sessionId: fact.sessionId,
        status: fact.status,
        occurredAt: fact.occurredAt,
        validatedBy: fact.validatedBy,
        validatedAt: fact.validatedAt,
        metadata: fact.metadata,
      },
      create: {
        clubId: params.clubId,
        playerId: fact.playerId,
        sessionId: fact.sessionId,
        type: fact.type,
        sourceId: fact.sourceId,
        status: fact.status,
        occurredAt: fact.occurredAt,
        validatedBy: fact.validatedBy,
        validatedAt: fact.validatedAt,
        metadata: fact.metadata,
        idempotencyKey: key,
      },
    });
  }

  return {
    playerId: params.playerId,
    byType,
    total: facts.length,
    duplicated,
  };
}

export async function getPlayerStreakEvidence(params: {
  playerId: string;
  clubId: string;
}): Promise<EvidenceRow[]> {
  const rows = await prisma.streakEvidence.findMany({
    where: { playerId: params.playerId, clubId: params.clubId },
    orderBy: { occurredAt: "desc" },
    take: 300,
    select: {
      id: true,
      type: true,
      sourceId: true,
      status: true,
      occurredAt: true,
      validatedBy: true,
      validatedAt: true,
      metadata: true,
      idempotencyKey: true,
    },
  });
  return rows;
}