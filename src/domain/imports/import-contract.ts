export type ImportRowValidationStatus = "VALID" | "WARNING" | "ERROR" | "CORRECTED";

export interface ImportRowValidation {
  status: ImportRowValidationStatus;
  errorCode?: string;
  errorMessage?: string;
  correctedData?: Record<string, unknown>;
}

export interface ImportStageRow<T = Record<string, unknown>> {
  rowNumber: number;
  sourceRowKey: string | null;
  rawData: T;
  validation: ImportRowValidation;
}

export interface ImportStageResult<T = Record<string, unknown>> {
  rows: ImportStageRow<T>[];
  validRows: number;
  errorRows: number;
  readyToApply: boolean;
}

export interface RowValidator<T = Record<string, unknown>> {
  validate(row: T, rowNumber: number): ImportRowValidation;
}

export function stageRows<T = Record<string, unknown>>(
  rows: T[],
  validator: RowValidator<T>,
  sourceRowKeyFor: (row: T, rowNumber: number) => string | null
): ImportStageResult<T> {
  const staged: ImportStageRow<T>[] = rows.map((row, index) => {
    const rowNumber = index + 1;
    return {
      rowNumber,
      sourceRowKey: sourceRowKeyFor(row, rowNumber) ?? null,
      rawData: structuredClone(row),
      validation: validator.validate(row, rowNumber),
    };
  });

  const validRows = staged.filter((row) => row.validation.status === "VALID" || row.validation.status === "WARNING").length;
  const errorRows = staged.filter((row) => row.validation.status === "ERROR" || row.validation.status === "CORRECTED").length;

  return {
    rows: staged,
    validRows,
    errorRows,
    readyToApply: errorRows === 0,
  };
}

export function idempotencyKeyOf(importBatchId: string, table: string, sourceRowKey: string): string {
  return `import:${importBatchId}:${table}:${sourceRowKey}`;
}