import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { scopesFor } from "@/lib/domain-scope";
import { stageRows, idempotencyKeyOf } from "@/domain/imports/import-contract";
import type { ImportBatchStatus, ImportRowStatus } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { parsePetContributionCsv } from "@/lib/imports/csv-parser";
import { petContributionValidator, type RawPetContributionRow } from "@/lib/imports/validators";

export const SUPPORTED_IMPORT_TYPES = ["pet_contributions"] as const;
export type SupportedImportType = (typeof SUPPORTED_IMPORT_TYPES)[number];

function isSupportedImportType(value: string): value is SupportedImportType {
  return SUPPORTED_IMPORT_TYPES.includes(value as SupportedImportType);
}

function fileHashOf(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export interface ImportBatchSummary {
  id: string;
  importType: string;
  fileName: string;
  clubId: string | null;
  clubName: string | null;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  uploadedBy: string;
  uploadedAt: Date;
  appliedAt: Date | null;
}

export interface ImportRowErrorRow {
  id: string;
  importBatchId: string;
  rowNumber: number;
  sourceRowKey: string | null;
  rawData: Prisma.JsonValue;
  errorCode: string;
  errorMessage: string;
  correctedData: Prisma.JsonValue;
  status: ImportRowStatus;
  correctedBy: string | null;
  correctedAt: Date | null;
}

export interface ImportWorkspace {
  batches: ImportBatchSummary[];
  errors: ImportRowErrorRow[];
}

export async function getImportWorkspace(user: SessionUser): Promise<ImportWorkspace> {
  if (!(user.role === "ADMIN" || user.role === "SUPERADMIN")) throw new Error("Sin permiso de importación.");

  const scopes = await scopesFor(user);
  const scopedClubIds = scopes.map((scope) => scope.clubId);

  const where: Prisma.ImportBatchWhereInput = user.role === "SUPERADMIN" ? {} : { clubId: { in: scopedClubIds.length > 0 ? scopedClubIds : ["__none__"] } };

  const batches = await prisma.importBatch.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: 100,
    select: {
      id: true,
      importType: true,
      fileName: true,
      clubId: true,
      status: true,
      totalRows: true,
      validRows: true,
      errorRows: true,
      uploadedBy: true,
      uploadedAt: true,
      appliedAt: true,
    },
  });

  const clubIds = [...new Set(batches.filter((b) => b.clubId).map((b) => b.clubId as string))];
  const clubs = await prisma.team.findMany({ where: { id: { in: clubIds.length > 0 ? clubIds : ["__none__"] } }, select: { id: true, name: true } });
  const clubNames = new Map(clubs.map((c) => [c.id, c.name]));

  const errors = await prisma.importRowError.findMany({
    where: { importBatch: where },
    orderBy: [{ importBatchId: "desc" }, { rowNumber: "asc" }],
    take: 500,
    select: {
      id: true,
      importBatchId: true,
      rowNumber: true,
      sourceRowKey: true,
      rawData: true,
      errorCode: true,
      errorMessage: true,
      correctedData: true,
      status: true,
      correctedBy: true,
      correctedAt: true,
    },
  });

  return {
    batches: batches.map((b) => ({
      id: b.id,
      importType: b.importType,
      fileName: b.fileName,
      clubId: b.clubId,
      clubName: b.clubId ? clubNames.get(b.clubId) ?? null : null,
      status: b.status,
      totalRows: b.totalRows,
      validRows: b.validRows,
      errorRows: b.errorRows,
      uploadedBy: b.uploadedBy,
      uploadedAt: b.uploadedAt,
      appliedAt: b.appliedAt,
    })),
    errors: errors.map((r) => ({
      id: r.id,
      importBatchId: r.importBatchId,
      rowNumber: r.rowNumber,
      sourceRowKey: r.sourceRowKey,
      rawData: r.rawData,
      errorCode: r.errorCode,
      errorMessage: r.errorMessage,
      correctedData: r.correctedData,
      status: r.status,
      correctedBy: r.correctedBy,
      correctedAt: r.correctedAt,
    })),
  };
}

export interface CreateImportBatchParams {
  actor: SessionUser;
  clubId: string | null;
  importType: string;
  fileName: string;
  fileText: string;
}

export async function createImportBatch(params: CreateImportBatchParams): Promise<{
  batchId: string;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: { rowNumber: number; errorCode: string; errorMessage: string }[];
}> {
  const { actor, clubId, importType, fileName, fileText } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de importación.");
  if (!isSupportedImportType(importType)) throw new Error(`Tipo de importación no soportado: ${importType}`);

  const fileHash = fileHashOf(fileText);
  const existing = await prisma.importBatch.findUnique({
    where: { fileHash_importType: { fileHash, importType } },
    select: { id: true },
  });
  if (existing) throw new Error("Archivo idéntico ya importado previamente.");

  const { rows: parsedRows, errors: parseErrors } = parsePetContributionCsv(fileText);

  const stageResult = stageRows<RawPetContributionRow>(
    parsedRows as unknown as RawPetContributionRow[],
    petContributionValidator,
    (row, rowNum) => row.playerId ? `${row.playerId}_${row.recordedAt}_${row.bottlesCount}` : `row_${rowNum}`,
  );

  const totalRows = stageResult.rows.length + parseErrors.length;
  const validRows = stageResult.validRows;
  const errorRows = stageResult.errorRows + parseErrors.length;
  const readyToApply = stageResult.readyToApply && parseErrors.length === 0;

  const batch = await prisma.importBatch.create({
    data: {
      clubId,
      importType,
      fileName: fileName.trim(),
      fileHash,
      uploadedBy: actor.id,
      status: readyToApply ? "READY_TO_APPLY" : "VALIDATED",
      totalRows,
      validRows,
      errorRows,
    },
    select: { id: true },
  });

  await prisma.importRowError.createMany({
    data: [
      ...stageResult.rows.map((r) => ({
        importBatchId: batch.id,
        rowNumber: r.rowNumber,
        sourceRowKey: r.sourceRowKey,
        rawData: r.rawData as unknown as Prisma.InputJsonValue,
        errorCode: r.validation.errorCode ?? "",
        errorMessage: r.validation.errorMessage ?? "",
        correctedData: Prisma.DbNull,
        status: r.validation.status as ImportRowStatus,
        correctedBy: null,
        correctedAt: null,
      })),
      ...parseErrors.map((pe, index) => ({
        importBatchId: batch.id,
        rowNumber: stageResult.rows.length + index + 1,
        sourceRowKey: null,
        rawData: { error: pe.kind } as Prisma.InputJsonValue,
        errorCode: pe.kind,
        errorMessage: pe.message,
        correctedData: Prisma.DbNull,
        status: "ERROR" as ImportRowStatus,
        correctedBy: null,
        correctedAt: null,
      })),
    ],
  });

  return {
    batchId: batch.id,
    status: readyToApply ? "READY_TO_APPLY" : "VALIDATED",
    totalRows,
    validRows,
    errorRows,
    errors: stageResult.rows
      .filter((r) => r.validation.status === "ERROR")
      .map((r) => ({ rowNumber: r.rowNumber, errorCode: r.validation.errorCode ?? "UNKNOWN", errorMessage: r.validation.errorMessage ?? "Error desconocido" })),
  };
}

export interface ApplyImportBatchParams {
  actor: SessionUser;
  batchId: string;
}

export async function applyImportBatch(params: ApplyImportBatchParams): Promise<{
  applied: number;
  skipped: number;
  batchStatus: ImportBatchStatus;
}> {
  const { actor, batchId } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de importación.");

  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    select: { id: true, clubId: true, importType: true, status: true },
  });
  if (!batch) throw new Error("Lote de importación no encontrado.");
  if (batch.status === "APPLIED") throw new Error("Este lote ya fue aplicado.");
  if (batch.status === "CANCELLED") throw new Error("Este lote fue cancelado.");

  const rows = await prisma.importRowError.findMany({
    where: { importBatchId: batchId },
    orderBy: { rowNumber: "asc" },
    select: { id: true, rowNumber: true, rawData: true, correctedData: true, status: true, errorCode: true },
  });

  const errorRows = rows.filter((r) => r.status === "ERROR").length;
  if (errorRows > 0) throw new Error(`Hay ${errorRows} fila(s) con errores. Corrija antes de aplicar.`);

  let applied = 0;
  let skipped = 0;

  for (const row of rows) {
    const data = (row.correctedData ?? row.rawData) as Record<string, unknown>;
    const playerId = typeof data.playerId === "string" && data.playerId.trim() ? data.playerId.trim() : null;
    const bottlesCount = Number(data.bottlesCount ?? "0");
    const recordedAtRaw = typeof data.recordedAt === "string" ? data.recordedAt.trim() : "";
    const recordedAt = new Date(recordedAtRaw);
    if (!batch.clubId || !recordedAtRaw || Number.isNaN(recordedAt.getTime()) || bottlesCount < 0 || !Number.isInteger(bottlesCount)) {
      skipped++;
      continue;
    }

    const estimatedRaw = data.estimatedKg;
    let estimatedKg: number | null = null;
    if (typeof estimatedRaw === "number" && Number.isFinite(estimatedRaw)) estimatedKg = estimatedRaw;
    else if (typeof estimatedRaw === "string" && estimatedRaw.trim() !== "") {
      const n = Number(estimatedRaw);
      if (Number.isFinite(n) && n >= 0) estimatedKg = n;
    }
    const notes = typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

    const idempotencyKey = idempotencyKeyOf(batchId, "pet_contributions", String(row.rowNumber));

    try {
      await prisma.petContribution.upsert({
        where: { idempotencyKey },
        create: {
          clubId: batch.clubId,
          playerId,
          recordedBy: actor.id,
          recordedAt,
          bottlesCount,
          estimatedKg,
          notes,
          importBatchId: batchId,
          sourceRowNumber: row.rowNumber,
          idempotencyKey,
        },
        update: {},
      });
      await prisma.importRowError.update({
        where: { id: row.id },
        data: { status: "APPLIED", errorCode: "", errorMessage: "" },
      });
      applied++;
    } catch {
      skipped++;
    }
  }

  await prisma.importBatch.update({
    where: { id: batchId },
    data: { status: "APPLIED", appliedAt: new Date(), totalRows: applied + skipped, validRows: applied, errorRows: skipped },
  });

  return { applied, skipped, batchStatus: "APPLIED" };
}

export interface CorrectImportRowParams {
  actor: SessionUser;
  rowId: string;
  correctedData: Record<string, unknown>;
}

export async function correctImportRow(params: CorrectImportRowParams): Promise<void> {
  const { actor, rowId, correctedData } = params;
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Sin permiso de importación.");

  const batchWhere: Prisma.ImportRowErrorWhereInput = {
    id: rowId,
    importBatch: { status: { in: ["VALIDATED", "READY_TO_APPLY", "UPLOADED", "PARSED"] } },
  };

  const row = await prisma.importRowError.findFirst({
    where: batchWhere,
    select: { id: true, importBatchId: true, status: true },
  });
  if (!row) throw new Error("Fila de importación no encontrada o lote ya aplicado.");

  await prisma.importRowError.update({
    where: { id: rowId },
    data: {
      correctedData: correctedData as Prisma.InputJsonValue,
      status: "CORRECTED",
      correctedBy: actor.id,
      correctedAt: new Date(),
    },
  });

  const remaining = await prisma.importRowError.count({
    where: { importBatchId: row.importBatchId, status: "ERROR" },
  });
  if (remaining === 0) {
    await prisma.importBatch.update({
      where: { id: row.importBatchId },
      data: { status: "READY_TO_APPLY" },
    });
  }
}