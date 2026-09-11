export interface PetContributionImportRow {
  playerId?: string;
  bottlesCount: number;
  recordedAt: string;
  estimatedKg?: number;
  notes?: string;
}

type ImportErrorKind = "REQUIRED" | "INVALID" | "NON_NUMERIC" | "NON_POSITIVE" | "INVALID_DATE";

interface ImportError {
  field: string;
  kind: ImportErrorKind;
  message: string;
}

function normalizeHeader(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === "jugador" || lower === "player" || lower === "jugador_id") return "playerId";
  if (lower === "botellas" || lower === "bottles" || lower === "bottles_count" || lower === "bottlescount") return "bottlesCount";
  if (lower === "fecha" || lower === "date" || lower === "recorded_at" || lower === "recordedat" || lower === "fecha_recoleccion") return "recordedAt";
  if (lower === "kg estimados" || lower === "kg" || lower === "estimated_kg" || lower === "estimatedkg" || lower === "est") return "estimatedKg";
  if (lower === "notas" || lower === "notes") return "notes";
  return lower;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < s.length && s[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === ",") {
        current.push(field);
        field = "";
        i++;
      } else if (c === "\n") {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  current.push(field);
  if (current.some((f) => f.trim() !== "")) rows.push(current);
  return rows;
}

function toISODate(raw: string): string | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
  return null;
}

export function parsePetContributionCsv(csvText: string): { rows: PetContributionImportRow[]; errors: ImportError[] } {
  const raw = parseCsv(csvText);
  if (raw.length === 0) return { rows: [], errors: [{ field: "file", kind: "REQUIRED", message: "Archivo vacío." }] };
  const [headerLine, ...dataLines] = raw;
  const headers = headerLine.map(normalizeHeader);
  const errors: ImportError[] = [];
  const rows: PetContributionImportRow[] = [];

  for (let idx = 0; idx < dataLines.length; idx++) {
    const values = dataLines[idx];
    if (!values || values.every((v) => v.trim() === "")) continue;
    const row: Record<string, string> = {};
    for (let col = 0; col < headers.length; col++) row[headers[col]] = (values[col] ?? "").trim();
    const rowNum = idx + 1;

    const playerId = row.playerId?.trim() || undefined;

    let bottles: number | undefined;
    const bottlesRaw = row.bottlesCount?.trim() ?? "";
    if (!bottlesRaw) {
      errors.push({ field: `row_${rowNum}_bottlesCount`, kind: "REQUIRED", message: `Fila ${rowNum}: botellas es obligatorio.` });
    } else {
      const parsed = Number(bottlesRaw);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed !== Math.floor(parsed)) {
        errors.push({ field: `row_${rowNum}_bottlesCount`, kind: "NON_NUMERIC", message: `Fila ${rowNum}: botellas debe ser entero.` });
      } else if (parsed < 0) {
        errors.push({ field: `row_${rowNum}_bottlesCount`, kind: "NON_POSITIVE", message: `Fila ${rowNum}: botellas no puede ser negativo.` });
      } else {
        bottles = parsed;
      }
    }

    let recordedAt: string | undefined;
    const recordedRaw = row.recordedAt?.trim() ?? "";
    if (!recordedRaw) {
      errors.push({ field: `row_${rowNum}_recordedAt`, kind: "REQUIRED", message: `Fila ${rowNum}: fecha es obligatoria.` });
    } else {
      const iso = toISODate(recordedRaw);
      if (!iso) {
        errors.push({ field: `row_${rowNum}_recordedAt`, kind: "INVALID_DATE", message: `Fila ${rowNum}: fecha inválida (use YYYY-MM-DD o DD/MM/YYYY).` });
      } else {
        recordedAt = iso;
      }
    }

    let estimatedKg: number | undefined;
    const estRaw = row.estimatedKg?.trim();
    if (estRaw) {
      const parsedEst = Number(estRaw);
      if (Number.isNaN(parsedEst) || !Number.isFinite(parsedEst) || parsedEst < 0) {
        errors.push({ field: `row_${rowNum}_estimatedKg`, kind: "INVALID", message: `Fila ${rowNum}: kg estimados debe ser un número >= 0.` });
      } else {
        estimatedKg = parsedEst;
      }
    }

    const notes = row.notes?.trim() || undefined;

    if (bottles !== undefined && recordedAt) {
      rows.push({ playerId, bottlesCount: bottles, recordedAt, estimatedKg, notes });
    }
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({ field: "file", kind: "REQUIRED", message: "No se encontraron filas de datos válidas." });
  }

  return { rows, errors };
}