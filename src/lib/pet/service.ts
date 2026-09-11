import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import {
  ALLOWED_PET_BATCH_TRANSITIONS,
  requireWeigh,
  requireSettle,
  requireReconcile,
  requireDispatch,
  pricePerKg,
  type PetBatchState,
} from "@/domain/pet/pet-invariants";

export type { PetBatchState } from "@/domain/pet/pet-invariants";

function requireAdmin(user: SessionUser): void {
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new Error("Solo Admin puede administrar el flujo PET.");
  }
}

function positiveInt(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} debe ser un entero >= 0.`);
  }
}

export interface PetWorkspaceClub {
  clubId: string;
  clubName: string;
  players: { id: string; name: string }[];
  contributions: PetContributionRow[];
  batches: PetBatchRow[];
}

export interface PetContributionRow {
  id: string;
  clubId: string;
  playerId: string | null;
  playerName: string | null;
  bottlesCount: number;
  estimatedKg: number | null;
  status: string;
  recordedAt: Date;
  batchId: string | null;
  batchStatus: string | null;
}

export interface PetBatchRow {
  id: string;
  batchCode: string;
  clubId: string;
  status: PetBatchState;
  bottlesSent: number | null;
  estimatedKg: number | null;
  dispatchDate: Date | null;
  receivedAt: Date | null;
  realKg: number | null;
  processorName: string | null;
  weighingDocumentUrl: string | null;
  copPaid: number | null;
  pricePerKg: number | null;
  paymentReference: string | null;
  reconciledAt: Date | null;
  reconciledBy: string | null;
  contributionCount: number;
}

export async function getPetWorkspace(user: SessionUser): Promise<PetWorkspaceClub[]> {
  requireAdmin(user);

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      members: { where: { role: "PLAYER" }, select: { userId: true } },
    },
    orderBy: { name: "asc" },
  });
  const clubIds = teams.map((team) => team.id);
  const playerIds = [...new Set(teams.flatMap((team) => team.members.map((member) => member.userId)))];
  const users = playerIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } })
    : [];
  const userName = new Map(users.map((user) => [user.id, user.name]));

  const contributions = clubIds.length > 0
    ? await prisma.petContribution.findMany({
        where: { clubId: { in: clubIds } },
        orderBy: { recordedAt: "desc" },
        take: 500,
        select: {
          id: true,
          clubId: true,
          playerId: true,
          bottlesCount: true,
          estimatedKg: true,
          status: true,
          recordedAt: true,
          batchId: true,
          batch: { select: { status: true } },
        },
      })
    : [];

  const batches = clubIds.length > 0
    ? await prisma.petBatch.findMany({
        where: { clubId: { in: clubIds } },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          id: true,
          batchCode: true,
          clubId: true,
          status: true,
          bottlesSent: true,
          estimatedKg: true,
          dispatchDate: true,
          receivedAt: true,
          realKg: true,
          processorName: true,
          weighingDocumentUrl: true,
          closedAt: true,
          settlement: { select: { copPaid: true, pricePerKg: true, paymentReference: true, reconciledAt: true, reconciledBy: true } },
          _count: { select: { contributions: true } },
        },
      })
    : [];

  return teams.map((team) => {
    const clubContributions = contributions
      .filter((contribution) => contribution.clubId === team.id)
      .map((contribution) => ({
        id: contribution.id,
        clubId: contribution.clubId,
        playerId: contribution.playerId,
        playerName: contribution.playerId ? (userName.get(contribution.playerId) ?? "Sin nombre") : null,
        bottlesCount: contribution.bottlesCount,
        estimatedKg: contribution.estimatedKg !== null && contribution.estimatedKg !== undefined ? Number(contribution.estimatedKg) : null,
        status: contribution.status,
        recordedAt: contribution.recordedAt,
        batchId: contribution.batchId,
        batchStatus: contribution.batch?.status ?? null,
      }));

    const clubBatches = batches
      .filter((batch) => batch.clubId === team.id)
      .map((batch) => ({
        id: batch.id,
        batchCode: batch.batchCode,
        clubId: batch.clubId,
        status: batch.status as PetBatchState,
        bottlesSent: batch.bottlesSent,
        estimatedKg: batch.estimatedKg !== null && batch.estimatedKg !== undefined ? Number(batch.estimatedKg) : null,
        dispatchDate: batch.dispatchDate,
        receivedAt: batch.receivedAt,
        realKg: batch.realKg !== null && batch.realKg !== undefined ? Number(batch.realKg) : null,
        processorName: batch.processorName,
        weighingDocumentUrl: batch.weighingDocumentUrl,
        copPaid: batch.settlement?.copPaid !== undefined ? Number(batch.settlement.copPaid) : null,
        pricePerKg: batch.settlement?.pricePerKg !== null && batch.settlement?.pricePerKg !== undefined ? Number(batch.settlement.pricePerKg) : null,
        paymentReference: batch.settlement?.paymentReference ?? null,
        reconciledAt: batch.settlement?.reconciledAt ?? batch.closedAt ?? null,
        reconciledBy: batch.settlement?.reconciledBy ?? null,
        contributionCount: batch._count.contributions,
      }));

    return {
      clubId: team.id,
      clubName: team.name,
      players: team.members
        .map((member) => ({ id: member.userId, name: userName.get(member.userId) ?? "Sin nombre" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      contributions: clubContributions,
      batches: clubBatches,
    };
  });
}

export async function createPetContribution(params: {
  actor: SessionUser;
  clubId: string;
  playerId: string | null;
  sessionId?: string | null;
  bottlesCount: number;
  recordedAt: Date;
  estimatedKg: number | null;
  notes?: string | null;
}): Promise<{ id: string }> {
  requireAdmin(params.actor);
  positiveInt(params.bottlesCount, "bottlesCount");
  if (params.estimatedKg !== null && params.estimatedKg < 0) {
    throw new Error("estimatedKg debe ser >= 0.");
  }
  const created = await prisma.petContribution.create({
    data: {
      clubId: params.clubId,
      playerId: params.playerId,
      sessionId: params.sessionId?.trim() || null,
      recordedBy: params.actor.id,
      recordedAt: params.recordedAt,
      bottlesCount: params.bottlesCount,
      estimatedKg: params.estimatedKg,
      notes: params.notes?.trim() || null,
      idempotencyKey: `manual:${randomUUID()}`,
    },
    select: { id: true },
  });
  return { id: created.id };
}

export async function createPetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchCode: string;
  contributionIds: string[];
}): Promise<{ id: string; batchCode: string }> {
  requireAdmin(params.actor);
  const code = params.batchCode.trim();
  if (!code) throw new Error("batchCode es obligatorio.");
  if (params.contributionIds.length === 0) throw new Error("Un lote requiere al menos una contribución.");

  const contributions = await prisma.petContribution.findMany({
    where: { id: { in: params.contributionIds }, clubId: params.clubId },
    select: { id: true, status: true },
  });
  if (contributions.length !== params.contributionIds.length) {
    throw new Error("Alguna contribución no pertenece al club seleccionado.");
  }
  const invalid = contributions.find((contribution) => contribution.status !== "COLLECTED");
  if (invalid) {
    throw new Error("Solo contribuciones COLLECTED pueden ingresar a un lote nuevo.");
  }

  const estimatedStars = await prisma.petContribution.aggregate({
    where: { id: { in: params.contributionIds } },
    _sum: { estimatedKg: true },
  });

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.petBatch.create({
      data: {
        clubId: params.clubId,
        batchCode: code,
        status: "DRAFT",
        estimatedKg: estimatedStars._sum.estimatedKg ?? null,
      },
      select: { id: true, batchCode: true },
    });
    await tx.petContribution.updateMany({
      where: { id: { in: params.contributionIds } },
      data: { batchId: created.id, status: "IN_BATCH" },
    });
    return created;
  });

  return { id: batch.id, batchCode: batch.batchCode };
}

async function loadBatch(batchId: string, clubId: string) {
  const batch = await prisma.petBatch.findFirst({
    where: { id: batchId, clubId },
    select: {
      id: true,
      status: true,
      realKg: true,
      settlement: { select: { id: true, realKg: true, status: true } },
    },
  });
  if (!batch) throw new Error("Lote no encontrado en este club.");
  return batch;
}

export async function dispatchPetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchId: string;
  dispatchDate: Date;
  bottlesSent: number;
  processorName?: string | null;
}): Promise<{ id: string; status: PetBatchState }> {
  requireAdmin(params.actor);
  const batch = await loadBatch(params.batchId, params.clubId);
  const facts = { status: batch.status as PetBatchState, realKg: null, copPaid: null, paymentReference: null };
  const check = requireDispatch(facts, {
    dispatchDate: params.dispatchDate,
    bottlesSent: params.bottlesSent,
    dispatchedBy: params.actor.id,
  });
  if (!check.ok) throw new Error(check.reason);

  const updated = await prisma.petBatch.update({
    where: { id: batch.id },
    data: { status: "SENT", dispatchDate: params.dispatchDate, bottlesSent: params.bottlesSent, dispatchedBy: params.actor.id, processorName: params.processorName?.trim() || null },
    select: { id: true, status: true },
  });
  return { id: updated.id, status: updated.status as PetBatchState };
}

export async function weighPetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchId: string;
  receivedAt: Date;
  realKg: number;
  processorName: string;
  weighingDocumentUrl: string;
}): Promise<{ id: string; status: PetBatchState }> {
  requireAdmin(params.actor);
  const batch = await loadBatch(params.batchId, params.clubId);
  const facts = { status: batch.status as PetBatchState, realKg: null, copPaid: null, paymentReference: null };
  const check = requireWeigh(facts, {
    receivedAt: params.receivedAt,
    realKg: params.realKg,
    processorName: params.processorName,
    weighingDocumentUrl: params.weighingDocumentUrl,
  });
  if (!check.ok) throw new Error(check.reason);

  const updated = await prisma.petBatch.update({
    where: { id: batch.id },
    data: {
      status: "WEIGHED",
      receivedAt: params.receivedAt,
      realKg: params.realKg,
      processorName: params.processorName.trim(),
      weighingDocumentUrl: params.weighingDocumentUrl.trim(),
    },
    select: { id: true, status: true },
  });

  return { id: updated.id, status: updated.status as PetBatchState };
}

export async function settlePetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchId: string;
  copPaid: number;
  settlementDocumentUrl: string;
}): Promise<{ id: string; status: PetBatchState; pricePerKg: number | null }> {
  requireAdmin(params.actor);
  const batch = await loadBatch(params.batchId, params.clubId);
  if (batch.realKg === null || batch.realKg === undefined || Number(batch.realKg) <= 0) {
    throw new Error("No se puede liquidar sin kg real validado (WEIGHED).");
  }
  const facts = { status: batch.status as PetBatchState, realKg: Number(batch.realKg), copPaid: null, paymentReference: null };
  const check = requireSettle(facts, { copPaid: params.copPaid, settlementDocumentUrl: params.settlementDocumentUrl });
  if (!check.ok) throw new Error(check.reason);
  if (params.copPaid < 0) throw new Error("copPaid debe ser >= 0.");
  if (!params.settlementDocumentUrl.trim()) throw new Error("Se requiere soporte de liquidación/referencia.");

  const computed = pricePerKg(params.copPaid, Number(batch.realKg));

  await prisma.$transaction(async (tx) => {
    await tx.petBatch.update({
      where: { id: batch.id },
      data: { status: "SETTLED", closedBy: params.actor.id, closedAt: new Date() },
    });
    await tx.petSettlement.upsert({
      where: { batchId: batch.id },
      update: {
        status: "SETTLED",
        copPaid: params.copPaid,
        pricePerKg: computed,
        settlementDocumentUrl: params.settlementDocumentUrl.trim(),
        settledAt: new Date(),
      },
      create: {
        clubId: params.clubId,
        batchId: batch.id,
        status: "SETTLED",
        realKg: Number(batch.realKg),
        copPaid: params.copPaid,
        pricePerKg: computed,
        settlementDocumentUrl: params.settlementDocumentUrl.trim(),
        settledAt: new Date(),
      },
    });
  });

  return { id: batch.id, status: "SETTLED", pricePerKg: computed };
}

export async function reconcilePetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchId: string;
  paymentReference: string;
}): Promise<{ id: string; status: PetBatchState }> {
  requireAdmin(params.actor);
  const batch = await loadBatch(params.batchId, params.clubId);
  const facts = { status: batch.status as PetBatchState, realKg: batch.realKg !== null && batch.realKg !== undefined ? Number(batch.realKg) : null, copPaid: null, paymentReference: null };
  const check = requireReconcile(facts, { paymentReference: params.paymentReference, reconciledBy: params.actor.id });
  if (!check.ok) throw new Error(check.reason);

  await prisma.$transaction(async (tx) => {
    await tx.petBatch.update({ where: { id: batch.id }, data: { status: "RECONCILED" } });
    await tx.petSettlement.update({
      where: { batchId: batch.id },
      data: {
        status: "RECONCILED",
        paymentReference: params.paymentReference.trim(),
        reconciledAt: new Date(),
        reconciledBy: params.actor.id,
      },
    });
  });

  return { id: batch.id, status: "RECONCILED" };
}

export async function cancelPetBatch(params: {
  actor: SessionUser;
  clubId: string;
  batchId: string;
}): Promise<{ id: string; status: PetBatchState }> {
  requireAdmin(params.actor);
  const batch = await loadBatch(params.batchId, params.clubId);
  const current = batch.status as PetBatchState;
  if (!(ALLOWED_PET_BATCH_TRANSITIONS[current] ?? []).includes("CANCELLED")) {
    throw new Error(`El lote ${current} no se puede cancelar.`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.petBatch.update({ where: { id: batch.id }, data: { status: "CANCELLED" } });
    await tx.petContribution.updateMany({
      where: { batchId: batch.id, status: "IN_BATCH" },
      data: { status: "COLLECTED", batchId: null },
    });
  });
  return { id: batch.id, status: "CANCELLED" };
}