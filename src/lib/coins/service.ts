import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { scopesFor } from "@/lib/domain-scope";
import { evaluateCoinMutation, type CoinMutationInput, type CoinEngineDecision, type CoinRuleView } from "@/domain/coins/coin-engine";
import type { CoinSourceType, CoinLedgerStatus, Prisma } from "@/generated/prisma/client";

export type { CoinSourceType, CoinLedgerStatus } from "@/generated/prisma/client";
export type { CoinEngineDecision, CoinRuleView } from "@/domain/coins/coin-engine";

async function activeRuleFor(sourceType: CoinSourceType) {
  return prisma.coinRuleVersion.findFirst({
    where: { sourceType, status: "ACTIVE" },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: { id: true, version: true, sourceType: true, sourceEvent: true, config: true },
  });
}

export interface PostCoinMutationParams {
  actor: SessionUser;
  playerId: string;
  clubId: string;
  sourceType: CoinSourceType;
  sourceId: string;
  sourceValue?: number | null;
  coinDelta?: number | null;
  idempotencyKey: string;
  occurredAt: Date;
  notes?: string | null;
  correctionId?: string | null;
}

export async function postCoinMutation(params: PostCoinMutationParams): Promise<CoinEngineDecision & { ledgerId?: string; droppedAsDuplicate?: boolean }> {
  const { actor, playerId, clubId, sourceType, sourceId, sourceValue, coinDelta, idempotencyKey, occurredAt, notes, correctionId } = params;

  const rawInput: CoinMutationInput = {
    playerId,
    clubId,
    sourceType,
    sourceId,
    sourceValue: sourceValue ?? null,
    coinDelta: coinDelta ?? null,
    idempotencyKey,
    createdBy: actor.id,
    occurredAt,
  };

  const existing = await prisma.crackCoinLedger.findUnique({
    where: { idempotencyKey },
    select: { id: true, coinDelta: true, rule: { select: { version: true } } },
  });
  if (existing) {
    return { status: "POSTED", createdLedgerEntry: true, coinDelta: existing.coinDelta, ruleVersion: existing.rule?.version ?? "", ledgerId: existing.id, droppedAsDuplicate: true };
  }

  const rawRule = await activeRuleFor(sourceType);
  const activeRule: CoinRuleView | null = rawRule
    ? { id: rawRule.id, version: rawRule.version, sourceType: rawRule.sourceType, sourceEvent: rawRule.sourceEvent, status: "ACTIVE", config: rawRule.config as Record<string, unknown> | null }
    : null;
  const decision = evaluateCoinMutation(rawInput, activeRule);

  if (decision.status === "POSTED") {
    const ledger = await prisma.crackCoinLedger.create({
      data: {
        clubId,
        playerId,
        occurredAt,
        sourceType,
        sourceId,
        ruleVersionId: activeRule?.id ?? null,
        coinDelta: decision.coinDelta,
        status: "POSTED",
        idempotencyKey,
        createdBy: actor.id,
        correctionId: correctionId ?? null,
        notes: notes ?? null,
      },
      select: { id: true, coinDelta: true, status: true },
    });
    return { ...decision, ledgerId: ledger.id, droppedAsDuplicate: false };
  }

  return { ...decision, droppedAsDuplicate: false };
}

export interface CoinLedgerRow {
  id: string;
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  occurredAt: Date;
  sourceType: CoinSourceType;
  sourceId: string;
  ruleVersion: string | null;
  coinDelta: number;
  status: CoinLedgerStatus;
  notes: string | null;
  reversalOfId: string | null;
}

export interface CoinsWorkspace {
  balances: { clubId: string; clubName: string; playerId: string; playerName: string; balance: number }[];
  ledger: CoinLedgerRow[];
}

export async function getCoinsWorkspace(user: SessionUser): Promise<CoinsWorkspace> {
  const scopes = await scopesFor(user);

  const clubIds = [...new Set(scopes.map((s) => s.clubId))];
  const where: Prisma.CrackCoinLedgerWhereInput = user.role === "SUPERADMIN"
    ? {}
    : { clubId: { in: clubIds.length > 0 ? clubIds : ["__none__"] } };

  const ledger = await prisma.crackCoinLedger.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: 1000,
    select: {
      id: true,
      playerId: true,
      clubId: true,
      occurredAt: true,
      sourceType: true,
      sourceId: true,
      rule: { select: { version: true } },
      coinDelta: true,
      status: true,
      notes: true,
      reversalOfId: true,
    },
  });

  const playerIds = [...new Set(ledger.map((l) => l.playerId))];
  const users = playerIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } }) : [];
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const teamIds = clubIds.length > 0 ? clubIds : ["__none__"];
  const teams = await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } });
  const teamNames = new Map(teams.map((t) => [t.id, t.name]));

  const balancesMap = new Map<string, { clubId: string; playerId: string; balance: number }>();
  for (const row of ledger) {
    if (row.status !== "POSTED") continue;
    const key = `${row.clubId}:${row.playerId}`;
    const entry = balancesMap.get(key) ?? { clubId: row.clubId, playerId: row.playerId, balance: 0 };
    entry.balance += row.coinDelta;
    balancesMap.set(key, entry);
  }

  const balances = [...balancesMap.values()]
    .sort((a, b) => b.balance - a.balance)
    .map((row) => ({
      clubId: row.clubId,
      clubName: teamNames.get(row.clubId) ?? "—",
      playerId: row.playerId,
      playerName: userName.get(row.playerId) ?? "Sin nombre",
      balance: row.balance,
    }));

  return {
    balances,
    ledger: ledger.map((l) => ({
      id: l.id,
      playerId: l.playerId,
      playerName: userName.get(l.playerId) ?? "Sin nombre",
      clubId: l.clubId,
      clubName: teamNames.get(l.clubId) ?? "—",
      occurredAt: l.occurredAt,
      sourceType: l.sourceType,
      sourceId: l.sourceId,
      ruleVersion: l.rule?.version ?? null,
      coinDelta: l.coinDelta,
      status: l.status,
      notes: l.notes,
      reversalOfId: l.reversalOfId,
    })),
  };
}

export interface PostCoinCorrectionParams {
  actor: SessionUser;
  playerId: string;
  clubId: string;
  coinDelta: number;
  notes: string | null;
}

export async function postCoinCorrection(params: PostCoinCorrectionParams): Promise<CoinEngineDecision & { ledgerId?: string }> {
  const { actor, playerId, clubId, coinDelta, notes } = params;
  if (!Number.isInteger(coinDelta) || coinDelta === 0) throw new Error("El delta de corrección debe ser un entero distinto de cero.");
  if (!(actor.role === "ADMIN" || actor.role === "SUPERADMIN")) throw new Error("Solo ADMIN puede emitir correcciones de monedas.");

  const idempotencyKey = `correction:${actor.id}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  const decision = await postCoinMutation({
    actor,
    playerId,
    clubId,
    sourceType: "CORRECTION",
    sourceId: `manual:${actor.id}`,
    coinDelta,
    idempotencyKey,
    occurredAt: new Date(),
    notes,
  });
  return decision;
}