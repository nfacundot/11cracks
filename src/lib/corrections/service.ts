import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import type { CorrectionStatus, Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaValue } from "@/generated/prisma/client";

export type { CorrectionStatus, CoinLedgerStatus } from "@/generated/prisma/client";

export const SUPPORTED_CORRECTION_ENTITY_TYPES = ["coin_ledger"] as const;
export type SupportedCorrectionEntityType = (typeof SUPPORTED_CORRECTION_ENTITY_TYPES)[number];

export interface DataCorrectionRow {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string | null;
  originalValue: unknown;
  requestedValue: unknown;
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  status: CorrectionStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  appliedAt: Date | null;
}

export async function getCorrectionsWorkspace(user: SessionUser): Promise<{ corrections: DataCorrectionRow[] }> {
  if (!(user.role === "ADMIN" || user.role === "SUPERADMIN")) throw new Error("Sin permiso de correcciones.");

  const corrections = await prisma.dataCorrection.findMany({
    orderBy: { requestedAt: "desc" },
    take: 200,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      fieldName: true,
      originalValue: true,
      requestedValue: true,
      reason: true,
      requestedBy: true,
      requestedAt: true,
      status: true,
      approvedBy: true,
      approvedAt: true,
      appliedAt: true,
    },
  });

  return {
    corrections: corrections.map((c) => ({
      id: c.id,
      entityType: c.entityType,
      entityId: c.entityId,
      fieldName: c.fieldName,
      originalValue: c.originalValue ?? PrismaValue.DbNull,
      requestedValue: c.requestedValue ?? PrismaValue.DbNull,
      reason: c.reason,
      requestedBy: c.requestedBy,
      requestedAt: c.requestedAt,
      status: c.status,
      approvedBy: c.approvedBy,
      approvedAt: c.approvedAt,
      appliedAt: c.appliedAt,
    })),
  };
}

export interface RequestCorrectionParams {
  actor: SessionUser;
  entityType: string;
  entityId: string;
  fieldName?: string | null;
  requestedValue: Record<string, unknown>;
  reason: string;
}

export async function requestCorrection(params: RequestCorrectionParams): Promise<{ id: string; status: CorrectionStatus }> {
  const { actor, entityType, entityId, fieldName, requestedValue, reason } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de solicitar correcciones.");
  if (!reason.trim()) throw new Error("El motivo es obligatorio para auditar la corrección.");

  let originalValue: Record<string, unknown>;
  if (entityType === "coin_ledger") {
    const ledger = await prisma.crackCoinLedger.findUnique({
      where: { id: entityId },
      select: { id: true, playerId: true, clubId: true, coinDelta: true, status: true, sourceType: true, sourceId: true, notes: true },
    });
    if (!ledger) throw new Error("Movimiento de monedas no encontrado.");
    if (ledger.status !== "POSTED") throw new Error("Solo se puede corregir un movimiento POSTED.");
    originalValue = {
      coinDelta: ledger.coinDelta,
      status: ledger.status,
      playerId: ledger.playerId,
      clubId: ledger.clubId,
      sourceType: ledger.sourceType,
      sourceId: ledger.sourceId,
    };
  } else {
    throw new Error(`Tipo de entidad no soportado: ${entityType}`);
  }

  const correction = await prisma.dataCorrection.create({
    data: {
      entityType,
      entityId,
      fieldName: fieldName ?? null,
      originalValue: originalValue as Prisma.InputJsonValue,
      requestedValue: requestedValue as Prisma.InputJsonValue,
      reason: reason.trim(),
      requestedBy: actor.id,
    },
    select: { id: true, status: true },
  });

  return correction;
}

export async function reviewCorrection(params: { actor: SessionUser; correctionId: string; approve: boolean }): Promise<{ id: string; status: CorrectionStatus }> {
  const { actor, correctionId, approve } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de aprobar correcciones.");

  const correction = await prisma.dataCorrection.findUnique({ where: { id: correctionId }, select: { id: true, status: true } });
  if (!correction) throw new Error("Corrección no encontrada.");
  if (correction.status !== "PENDING") throw new Error("Solo se pueden revisar correcciones PENDING.");

  return prisma.dataCorrection.update({
    where: { id: correctionId },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      approvedBy: actor.id,
      approvedAt: new Date(),
    },
    select: { id: true, status: true },
  });
}

export async function applyCorrection(params: { actor: SessionUser; correctionId: string }): Promise<{ id: string; status: CorrectionStatus; ledger: { reversalId: string; replacementId: string } }> {
  const { actor, correctionId } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de aplicar correcciones.");

  const correction = await prisma.dataCorrection.findUnique({
    where: { id: correctionId },
    select: { id: true, entityType: true, entityId: true, originalValue: true, requestedValue: true, status: true, appliedAt: true },
  });
  if (!correction) throw new Error("Corrección no encontrada.");
  if (correction.status !== "APPROVED") throw new Error("Solo se puede aplicar una corrección APPROVED.");

  if (correction.entityType !== "coin_ledger") {
    throw new Error(`Tipo de entidad no soportado para aplicar: ${correction.entityType}`);
  }

  const original = await prisma.crackCoinLedger.findUnique({
    where: { id: correction.entityId },
    select: { id: true, clubId: true, playerId: true, occurredAt: true, sourceType: true, sourceId: true, coinDelta: true, status: true },
  });
  if (!original) throw new Error("Movimiento original no encontrado.");
  if (original.status !== "POSTED") throw new Error("El movimiento original ya no está POSTED.");

  const originalRaw = correction.originalValue as Record<string, unknown> | null;
  if (originalRaw?.coinDelta !== undefined && Number(originalRaw.coinDelta) !== original.coinDelta) {
    throw new Error("El valor original del movimiento cambió desde que se solicitó la corrección. Revierta y vuelva a solicitar.");
  }

  const requested = correction.requestedValue as Record<string, unknown>;
  const requestedDelta = Number(requested.coinDelta);
  if (!Number.isInteger(requestedDelta)) throw new Error("El delta solicitado debe ser entero.");

  const reversalKey = `correction-reversal:${correctionId}`;
  const replacementKey = `correction-replacement:${correctionId}`;

  const ledger = await prisma.$transaction(async (tx) => {
    const reversal = await tx.crackCoinLedger.upsert({
      where: { idempotencyKey: reversalKey },
      update: {},
      create: {
        clubId: original.clubId,
        playerId: original.playerId,
        occurredAt: new Date(),
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        coinDelta: -original.coinDelta,
        status: "POSTED",
        idempotencyKey: reversalKey,
        reversalOfId: original.id,
        createdBy: actor.id,
        correctionId,
        notes: `Reverso de ${original.sourceId}`,
      },
      select: { id: true },
    });

    await tx.crackCoinLedger.update({ where: { id: original.id }, data: { status: "REVERSED" } });

    const replacement = await tx.crackCoinLedger.upsert({
      where: { idempotencyKey: replacementKey },
      update: {},
      create: {
        clubId: original.clubId,
        playerId: original.playerId,
        occurredAt: new Date(),
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        coinDelta: requestedDelta,
        status: "POSTED",
        idempotencyKey: replacementKey,
        createdBy: actor.id,
        correctionId,
        notes: `Reemplazo tras corrección ${correctionId}`,
      },
      select: { id: true },
    });

    await tx.dataCorrection.update({
      where: { id: correctionId },
      data: { status: "APPLIED", appliedAt: new Date(), replacementRecordId: replacement.id },
    });

    return { reversalId: reversal.id, replacementId: replacement.id };
  });

  return { id: correctionId, status: "APPLIED", ledger };
}