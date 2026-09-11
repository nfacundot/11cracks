export type PetBatchState = "DRAFT" | "SENT" | "WEIGHED" | "SETTLED" | "RECONCILED" | "CANCELLED";

export type PetMutationResult = { ok: true } | { ok: false; reason: string };

export const ALLOWED_PET_BATCH_TRANSITIONS: Record<PetBatchState, PetBatchState[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["WEIGHED", "CANCELLED"],
  WEIGHED: ["SETTLED", "CANCELLED"],
  SETTLED: ["RECONCILED", "CANCELLED"],
  RECONCILED: [],
  CANCELLED: [],
};

export interface PetBatchFacts {
  status: PetBatchState;
  realKg: number | null;
  copPaid: number | null;
  paymentReference: string | null;
}

export function canTransition(from: PetBatchState, to: PetBatchState): boolean {
  return ALLOWED_PET_BATCH_TRANSITIONS[from].includes(to);
}

export function assertTransition(facts: PetBatchFacts, to: PetBatchState): PetMutationResult {
  if (!canTransition(facts.status, to)) {
    return { ok: false, reason: `Transición no permitida: ${facts.status} -> ${to}` };
  }
  return { ok: true };
}

export interface DispatchFacts {
  dispatchDate: Date;
  bottlesSent: number;
  dispatchedBy: string;
}

export function requireDispatch(facts: PetBatchFacts, meta: DispatchFacts): PetMutationResult {
  const transition = assertTransition(facts, "SENT");
  if (!transition.ok) return transition;
  if (!(meta.dispatchDate instanceof Date) || Number.isNaN(meta.dispatchDate.getTime())) {
    return { ok: false, reason: "Se requiere fecha de despacho válida." };
  }
  if (!Number.isInteger(meta.bottlesSent) || meta.bottlesSent < 0) {
    return { ok: false, reason: "bottlesSent debe ser un entero >= 0." };
  }
  if (!meta.dispatchedBy) {
    return { ok: false, reason: "Se requiere responsable de despacho." };
  }
  return { ok: true };
}

export interface WeighFacts {
  receivedAt: Date;
  realKg: number;
  processorName: string;
  weighingDocumentUrl: string;
}

export function requireWeigh(facts: PetBatchFacts, meta: WeighFacts): PetMutationResult {
  const transition = assertTransition(facts, "WEIGHED");
  if (!transition.ok) return transition;
  if (!(meta.receivedAt instanceof Date) || Number.isNaN(meta.receivedAt.getTime())) {
    return { ok: false, reason: "Se requiere fecha de recepción válida." };
  }
  if (!(meta.realKg > 0)) {
    return { ok: false, reason: "realKg debe ser mayor que 0. Sin pesaje documentado el lote no pasa a WEIGHED." };
  }
  if (!meta.processorName) {
    return { ok: false, reason: "Se requiere compactadora/procesador." };
  }
  if (!meta.weighingDocumentUrl) {
    return { ok: false, reason: "Se requiere documento de pesaje de la compactadora." };
  }
  return { ok: true };
}

export interface SettleFacts {
  copPaid: number;
  settlementDocumentUrl: string;
}

export function requireSettle(facts: PetBatchFacts, meta: SettleFacts): PetMutationResult {
  const transition = assertTransition(facts, "SETTLED");
  if (!transition.ok) return transition;
  if (!(facts.realKg !== null && facts.realKg > 0)) {
    return { ok: false, reason: "No se puede liquidar sin kg real validado (WEIGHED)." };
  }
  if (!(meta.copPaid >= 0)) {
    return { ok: false, reason: "copPaid debe ser >= 0." };
  }
  if (!meta.settlementDocumentUrl) {
    return { ok: false, reason: "Se requiere soporte de liquidación/referencia." };
  }
  return { ok: true };
}

export interface ReconcileFacts {
  paymentReference: string;
  reconciledBy: string;
}

export function requireReconcile(facts: PetBatchFacts, meta: ReconcileFacts): PetMutationResult {
  const transition = assertTransition(facts, "RECONCILED");
  if (!transition.ok) return transition;
  if (!meta.paymentReference) {
    return { ok: false, reason: "Conciliación requiere referencia de pago." };
  }
  if (!meta.reconciledBy) {
    return { ok: false, reason: "Conciliación requiere actor que concilia." };
  }
  return { ok: true };
}

export function pricePerKg(copPaid: number, realKg: number): number | null {
  if (!(realKg > 0)) return null;
  return Math.round((copPaid / realKg) * 10000) / 10000;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function estimatedToCop(estimatedKg: number | null): number | null {
  return null;
}