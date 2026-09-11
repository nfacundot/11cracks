import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeRubric, type RubricLevel } from "@/domain/evaluations/rubric";
import { calculateElevenScore } from "@/domain/scores/calculate-eleven-score";
import { assertInScope, scopesFor } from "@/lib/domain-scope";
import type { SessionUser } from "@/lib/auth";
import { DOMAIN_RULE_VERSION } from "@/config/domain-rules";

export type { EvaluationScope } from "@/lib/domain-scope";

export interface EvaluationItemInput {
  dimensionKey: string;
  rubricLevel: RubricLevel;
  comment?: string | null;
  evidenceUrl?: string | null;
}

export interface EvaluationScopePlayers {
  id: string;
  name: string;
}

export interface EvaluationsWorkspace {
  scopes: { clubId: string; clubName: string; players: EvaluationScopePlayers[] }[];
  dimensions: {
    key: string;
    label: string;
    group: "SPORT" | "NEUROCRACKS";
    description: string | null;
    sortOrder: number;
  }[];
  evaluations: EvaluationSummary[];
}

export interface EvaluationItemSummary {
  dimensionKey: string;
  rubricLevel: RubricLevel;
}

export interface EvaluationSummary {
  id: string;
  clubId: string;
  clubName: string;
  playerId: string;
  playerName: string;
  status: "DRAFT" | "PUBLISHED" | "CORRECTED" | "CANCELLED";
  periodStart: Date;
  periodEnd: Date;
  publishedAt: Date | null;
  supersedesEvaluationId: string | null;
  items: EvaluationItemSummary[];
}

export async function getEvaluationsWorkspace(user: SessionUser): Promise<EvaluationsWorkspace> {
  const scopes = await scopesFor(user);

  const dimensions = await prisma.evaluationDimensionDefinition.findMany({
    where: { active: true },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    select: { key: true, label: true, group: true, description: true, sortOrder: true },
  });

  const playerIds = [...new Set(scopes.flatMap((scope) => scope.playerIds))];
  const players = playerIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } })
    : [];
  const playerName = new Map(players.map((player) => [player.id, player.name]));

  const clubById = new Map(scopes.map((scope) => [scope.clubId, scope.clubName]));
  const evaluations = playerIds.length > 0
    ? await prisma.coachEvaluation.findMany({
        where: { playerId: { in: playerIds } },
        include: {
          items: {
            select: {
              id: true,
              rubricLevel: true,
              dimension: { select: { key: true } },
            },
          },
          supersedesEvaluation: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      })
    : [];

  return {
    scopes: scopes.map((scope) => ({
      clubId: scope.clubId,
      clubName: scope.clubName,
      players: scope.playerIds
        .map((playerId) => ({ id: playerId, name: playerName.get(playerId) ?? "Sin nombre" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })),
    dimensions,
    evaluations: evaluations.map((evaluation) => ({
      id: evaluation.id,
      clubId: evaluation.clubId,
      clubName: clubById.get(evaluation.clubId) ?? "Sin club",
      playerId: evaluation.playerId,
      playerName: playerName.get(evaluation.playerId) ?? "Sin nombre",
      status: evaluation.status,
      periodStart: evaluation.periodStart,
      periodEnd: evaluation.periodEnd,
      publishedAt: evaluation.publishedAt,
      supersedesEvaluationId: evaluation.supersedesEvaluation?.id ?? null,
      items: evaluation.items.map((item) => ({
        dimensionKey: item.dimension.key,
        rubricLevel: item.rubricLevel,
      })),
    })),
  };
}

function itemMap(input: EvaluationItemInput[]): Map<string, EvaluationItemInput> {
  const map = new Map<string, EvaluationItemInput>();
  for (const item of input) {
    if (!item.dimensionKey) continue;
    map.set(item.dimensionKey, item);
  }
  return map;
}

export async function createEvaluationDraft(params: {
  actor: SessionUser;
  clubId: string;
  playerId: string;
  periodStart: Date;
  periodEnd: Date;
  sessionId?: string | null;
  notes?: string | null;
  items: EvaluationItemInput[];
  supersedesEvaluationId?: string | null;
  status?: "DRAFT" | "PUBLISHED";
}): Promise<{ id: string; status: "DRAFT" | "PUBLISHED" }> {
  await assertInScope(params.actor, params.clubId, params.playerId);

  if (params.periodStart > params.periodEnd) {
    throw new Error("periodStart debe ser anterior o igual a periodEnd.");
  }

  const dimensions = await prisma.evaluationDimensionDefinition.findMany({
    where: { active: true },
    select: { id: true, key: true },
  });
  const dimensionByKey = new Map(dimensions.map((dimension) => [dimension.key, dimension.id]));

  const items = itemMap(params.items);
  const normalized = [...items.values()].map((item) => {
    const dimensionId = dimensionByKey.get(item.dimensionKey);
    if (!dimensionId) {
      throw new Error(`Dimensión desconocida o inactiva: ${item.dimensionKey}`);
    }
    return {
      dimensionId,
      rubricLevel: item.rubricLevel,
      normalizedValue: normalizeRubric(item.rubricLevel),
      comment: item.comment?.trim() || null,
      evidenceUrl: item.evidenceUrl?.trim() || null,
    };
  });

  let supersedesId: string | null = null;
  if (params.supersedesEvaluationId) {
    const original = await prisma.coachEvaluation.findUnique({
      where: { id: params.supersedesEvaluationId },
      select: { id: true, status: true, playerId: true, clubId: true },
    });
    if (!original || original.playerId !== params.playerId || original.clubId !== params.clubId) {
      throw new Error("La evaluación original no existe o no pertenece al mismo jugador/club.");
    }
    if (original.status !== "PUBLISHED" && original.status !== "CORRECTED") {
      throw new Error("Solo una evaluación publicada puede tener una versión correctiva.");
    }
    supersedesId = original.id;
  }

  const created = await prisma.coachEvaluation.create({
    data: {
      clubId: params.clubId,
      playerId: params.playerId,
      coachId: params.actor.id,
      sessionId: params.sessionId?.trim() || null,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      status: params.status ?? "DRAFT",
      notes: params.notes?.trim() || null,
      ruleVersion: DOMAIN_RULE_VERSION,
      publishedAt: params.status === "PUBLISHED" ? new Date() : null,
      publishedBy: params.status === "PUBLISHED" ? params.actor.id : null,
      supersedesEvaluationId: supersedesId,
      items: { create: normalized },
    },
    select: { id: true, status: true },
  });

  if (supersedesId) {
    await prisma.coachEvaluation.update({
      where: { id: supersedesId },
      data: { status: "CORRECTED" },
    });
  }

  return { id: created.id, status: created.status as "DRAFT" | "PUBLISHED" };
}

export async function publishEvaluation(params: {
  actor: SessionUser;
  evaluationId: string;
}): Promise<{
  id: string;
  status: "PUBLISHED";
  snapshot: { calculationStatus: "INCOMPLETE" | "FINAL" | "PREVIEW"; elevenScore: number | null };
}> {
  const evaluation = await prisma.coachEvaluation.findUnique({
    where: { id: params.evaluationId },
    include: { items: { select: { dimension: { select: { key: true } } } } },
  });
  if (!evaluation) {
    throw new Error("Evaluación no encontrada.");
  }
  await assertInScope(params.actor, evaluation.clubId, evaluation.playerId);

  if (evaluation.status !== "DRAFT") {
    throw new Error("Solo los borradores se pueden publicar.");
  }

  const activeDimensions = await prisma.evaluationDimensionDefinition.findMany({
    where: { active: true },
    select: { key: true },
  });
  const activeKeys = new Set(activeDimensions.map((dimension) => dimension.key));
  const authoredKeys = new Set(evaluation.items.map((item) => item.dimension.key));
  const missing = [...activeKeys].filter((key) => !authoredKeys.has(key));
  if (missing.length > 0) {
    throw new Error(`Evaluación incompleta. Faltan dimensiones: ${missing.join(", ")}. No se rellena lo faltante.`);
  }

  const published = await prisma.coachEvaluation.update({
    where: { id: evaluation.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedBy: params.actor.id },
    select: { id: true, status: true },
  });

  const snapshot = await recalculatePlayerScore({
    actor: params.actor,
    playerId: evaluation.playerId,
    clubId: evaluation.clubId,
  });

  return {
    id: published.id,
    status: "PUBLISHED",
    snapshot,
  };
}

export async function recalculatePlayerScore(params: {
  actor: SessionUser;
  playerId: string;
  clubId: string;
}): Promise<{ calculationStatus: "INCOMPLETE" | "FINAL" | "PREVIEW"; elevenScore: number | null }> {
  await assertInScope(params.actor, params.clubId, params.playerId);

  const formula = await prisma.scoreFormulaVersion.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!formula) {
    throw new Error("No existe una versión de fórmula ACTIVE.");
  }

  const published = await prisma.coachEvaluation.findFirst({
    where: { playerId: params.playerId, clubId: params.clubId, status: "PUBLISHED" },
    include: {
      items: { include: { dimension: { select: { key: true, group: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });
  if (!published) {
    return { calculationStatus: "INCOMPLETE", elevenScore: null };
  }

  const dimensions = await prisma.evaluationDimensionDefinition.findMany({
    where: { active: true },
    select: { id: true, key: true },
  });
  const dimensionIdByKey = new Map(dimensions.map((dimension) => [dimension.key, dimension.id]));

  const sportItems = published.items
    .filter((item) => item.dimension.group === "SPORT")
    .map((item) => ({ key: item.dimension.key, rubric: item.normalizedValue !== null ? Number(item.normalizedValue) : null }));

  const neuroCoach = published.items
    .filter((item) => item.dimension.group === "NEUROCRACKS")
    .map((item) => ({ key: item.dimension.key, coach: item.normalizedValue !== null ? Number(item.normalizedValue) : null }));

  const neuroDimensionIds = neuroCoach
    .map((item) => dimensionIdByKey.get(item.key))
    .filter((id): id is string => Boolean(id));

  const digitalScores = neuroDimensionIds.length > 0
    ? await prisma.neuroDigitalPeriodScore.findMany({
        where: {
          playerId: params.playerId,
          dimensionId: { in: neuroDimensionIds },
          periodStart: { gte: published.periodStart },
          periodEnd: { lte: published.periodEnd },
        },
        orderBy: { calculatedAt: "desc" },
        select: { dimensionId: true, score: true },
      })
    : [];
  const digitalByDimension = new Map<string, number>();
  for (const score of digitalScores) {
    if (!digitalByDimension.has(score.dimensionId)) {
      digitalByDimension.set(score.dimensionId, Number(score.score));
    }
  }

  const neuro = neuroCoach.map((item) => {
    const dimensionId = dimensionIdByKey.get(item.key);
    return {
      key: item.key,
      coach: item.coach,
      digital: dimensionId && digitalByDimension.has(dimensionId) ? digitalByDimension.get(dimensionId)! : null,
    };
  });

  const result = calculateElevenScore({
    sport: sportItems,
    neuro,
    weights: { sport: Number(formula.sportWeight), neuro: Number(formula.neuroWeight) },
  });

  const snapshot = await prisma.playerScoreSnapshot.upsert({
    where: {
      playerId_periodStart_periodEnd_formulaVersionId: {
        playerId: params.playerId,
        periodStart: published.periodStart,
        periodEnd: published.periodEnd,
        formulaVersionId: formula.id,
      },
    },
    update: {
      sportScore: result.sportScore,
      neuroScore: result.neuroScore,
      elevenScore: result.elevenScore,
      calculationStatus: result.calculationStatus,
      sourceSummary: {
        evaluationId: published.id,
        missing: result.missing,
      },
      calculatedAt: new Date(),
    },
    create: {
      clubId: params.clubId,
      playerId: params.playerId,
      periodStart: published.periodStart,
      periodEnd: published.periodEnd,
      formulaVersionId: formula.id,
      sportScore: result.sportScore,
      neuroScore: result.neuroScore,
      elevenScore: result.elevenScore,
      calculationStatus: result.calculationStatus,
      sourceSummary: {
        evaluationId: published.id,
        missing: result.missing,
      },
    },
  });

  return {
    calculationStatus: snapshot.calculationStatus,
    elevenScore: snapshot.elevenScore !== null ? Number(snapshot.elevenScore) : null,
  };
}