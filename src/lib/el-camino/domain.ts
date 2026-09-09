import type { BilingualGameId } from "@/lib/bilingual/game-contracts";
import type { BilingualJourneyProgress } from "@/lib/bilingual/game-contracts";

export type ElCaminoStageId = "casa" | "entrenamiento" | "gastronomia" | "hotel" | "estadio";

export interface ElCaminoNode {
  readonly id: string;
  readonly stageId: ElCaminoStageId;
  readonly stageTitle: string;
  readonly order: number;
  readonly title: string;
  readonly context: string;
  readonly gameId: BilingualGameId;
}

export interface ElCaminoStage {
  readonly id: ElCaminoStageId;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly nodes: readonly ElCaminoNode[];
}

const stageSeeds = [
  { id: "casa", title: "CASA", description: "Preparo mi mochila", contexts: ["Preparo mi mochila", "Me despido y salgo", "Listo para el viaje"] },
  { id: "entrenamiento", title: "ENTRENAMIENTO", description: "Llegamos a la cancha", contexts: ["Llegamos a la cancha", "Entreno con mi equipo", "Indicaciones e hidratación"] },
  { id: "gastronomia", title: "GASTRONOMÍA", description: "Nutrición deportiva", contexts: ["Elijo mi comida", "Hidratación", "Nutrición deportiva"] },
  { id: "hotel", title: "HOTEL", description: "Descanso para competir", contexts: ["Llegada y recepción", "Habitación", "Descanso y desayuno"] },
  { id: "estadio", title: "ESTADIO", description: "Rumbo al gran momento", contexts: ["Llegamos al estadio", "Me preparo con mi equipo", "Escucho y juego"] },
] as const;

const mechanics: readonly BilingualGameId[] = ["oido-de-crack", "gol-de-palabra", "letras-de-crack"];

export const EL_CAMINO_FIRST_PATH: readonly ElCaminoStage[] = stageSeeds.map((stage, stageIndex) => ({
  id: stage.id,
  order: stageIndex + 1,
  title: stage.title,
  description: stage.description,
  nodes: stage.contexts.map((context, nodeIndex) => ({
    id: `camino-1-${stage.id}-${nodeIndex + 1}`,
    stageId: stage.id,
    stageTitle: stage.title,
    order: stageIndex * 3 + nodeIndex + 1,
    title: context,
    context,
    gameId: mechanics[nodeIndex],
  })),
}));

export function getElCaminoFirstPath(): readonly ElCaminoStage[] {
  return EL_CAMINO_FIRST_PATH;
}

export function getElCaminoNodeState(node: ElCaminoNode, journey: BilingualJourneyProgress | null | undefined): "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" {
  const session = journey?.sessions[node.gameId];
  if (node.order <= mechanics.length) {
    if (journey?.completedGameIds.includes(node.gameId)) return "COMPLETED";
    if (journey?.activeGameId === node.gameId || session) return "IN_PROGRESS";
    return node.order === 1 || Boolean(journey?.completedGameIds.includes(mechanics[node.order - 2])) ? "AVAILABLE" : "LOCKED";
  }
  const prior = EL_CAMINO_FIRST_PATH.flatMap((stage) => stage.nodes).find((candidate) => candidate.order === node.order - 1);
  return prior && journey?.completedGameIds.includes(prior.gameId) ? "AVAILABLE" : "LOCKED";
}
