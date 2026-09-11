import type { RowValidator, ImportRowValidation } from "@/domain/imports/import-contract";

export interface RawPetContributionRow {
  playerId?: string;
  bottlesCount?: number | string;
  recordedAt?: string;
  estimatedKg?: number | string;
  notes?: string;
}

const ROLL_NUMBER_RE = /^\d{1,3}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export const petContributionValidator: RowValidator<RawPetContributionRow> = {
  validate(row: RawPetContributionRow, rowNumber: number): ImportRowValidation {
    const errs: { code: string; msg: string }[] = [];

    const playerId = typeof row.playerId === "string" ? row.playerId.trim() : "";
    if (playerId && !ROLL_NUMBER_RE.test(playerId) && playerId.length < 8) {
      errs.push({ code: "PET_PLAYER_ID_FORMAT", msg: `Fila ${rowNumber}: playerId tiene formato inválido.` });
    }

    const bottles = toNumber(row.bottlesCount);
    if (bottles === undefined) {
      errs.push({ code: "PET_BOTTLES_REQUIRED", msg: `Fila ${rowNumber}: botellas es obligatorio.` });
    } else if (bottles < 0 || bottles !== Math.floor(bottles)) {
      errs.push({ code: "PET_BOTTLES_INVALID", msg: `Fila ${rowNumber}: botellas debe ser entero >= 0.` });
    }

    const recordedAt = typeof row.recordedAt === "string" ? row.recordedAt.trim() : "";
    if (!recordedAt || !ISO_DATE_RE.test(recordedAt)) {
      errs.push({ code: "PET_RECORDED_AT_INVALID", msg: `Fila ${rowNumber}: fecha debe ser YYYY-MM-DD válido.` });
    }

    const est = toNumber(row.estimatedKg);
    if (row.estimatedKg !== undefined && row.estimatedKg !== null && row.estimatedKg !== "") {
      if (est === undefined || est < 0) {
        errs.push({ code: "PET_ESTIMATED_KG_INVALID", msg: `Fila ${rowNumber}: kg estimados debe ser un número >= 0.` });
      }
    }

    if (errs.length > 0) {
      return { status: "ERROR", errorCode: errs[0].code, errorMessage: errs.map((e) => e.msg).join(" ") };
    }

    return { status: "VALID" };
  },
};