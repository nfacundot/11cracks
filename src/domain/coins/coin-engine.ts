export type CoinSourceType = "PET" | "STREAK" | "CORRECTION";

export interface CoinRuleView {
  id: string;
  version: string;
  sourceType: CoinSourceType;
  sourceEvent: string | null;
  status: "ACTIVE";
  config: Record<string, unknown> | null;
}

export interface CoinMutationInput {
  playerId: string;
  clubId: string;
  sourceType: CoinSourceType;
  sourceId: string;
  sourceValue?: number | null;
  coinDelta?: number | null;
  idempotencyKey: string;
  createdBy: string;
  occurredAt: Date;
}

export type CoinEngineDecision =
  | { status: "PENDING_RULE"; createdLedgerEntry: false; reason: string }
  | { status: "INVALID_AMOUNT"; createdLedgerEntry: false; reason: string }
  | { status: "POSTED"; createdLedgerEntry: true; coinDelta: number; ruleVersion: string };

export function evaluateCoinMutation(
  input: CoinMutationInput,
  activeRule: CoinRuleView | null
): CoinEngineDecision {
  if (!activeRule) {
    return {
      status: "PENDING_RULE",
      createdLedgerEntry: false,
      reason: "No existe una regla ACTIVE para esta fuente. No se emiten monedas.",
    };
  }

  let coinDelta: number;

  if (input.sourceType === "CORRECTION") {
    if (input.coinDelta === null || input.coinDelta === undefined || !Number.isInteger(input.coinDelta)) {
      return {
        status: "INVALID_AMOUNT",
        createdLedgerEntry: false,
        reason: "Un movimiento CORRECTION requiere coinDelta entero explícito.",
      };
    }
    coinDelta = input.coinDelta;
  } else {
    const rate = typeof activeRule.config?.rate === "number" ? activeRule.config.rate : null;
    if (rate !== null && input.sourceValue !== null && input.sourceValue !== undefined) {
      coinDelta = Math.round(input.sourceValue * rate);
    } else if (input.coinDelta !== null && input.coinDelta !== undefined && Number.isInteger(input.coinDelta)) {
      coinDelta = input.coinDelta;
    } else {
      return {
        status: "INVALID_AMOUNT",
        createdLedgerEntry: false,
        reason: "La regla no define tasa y no se informó coinDelta válido.",
      };
    }
  }

  return {
    status: "POSTED",
    createdLedgerEntry: true,
    coinDelta,
    ruleVersion: activeRule.version,
  };
}