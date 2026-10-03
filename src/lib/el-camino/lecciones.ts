import type { GameCategory } from "@/lib/games";

export type NodoLeccionEstado = "COMPLETED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";

export interface NodoLeccion {
  id: string;
  order: number;
  title: string;
  emoji: string;
  color: string;
  xpReward: number;
  questionCount: number;
  description: string | null;
  estado: NodoLeccionEstado;
  bestScore: number;
  gameSlug?: string | null;
  gameLabel?: string | null;
  gameCategory?: GameCategory | null;
  lessonType?: string | null;
  posX?: number;
  posY?: number;
}

export interface EtapaLeccion {
  id: string;
  order: number;
  title: string;
  emoji: string;
  color: string;
  xpReward: number;
  posX?: number;
  posY?: number;
  nodes: readonly NodoLeccion[];
}

export interface ClaseCamino {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  order: number;
  stages: readonly EtapaLeccion[];
}

export function nodosDeCamino(camino: ClaseCamino): readonly NodoLeccion[] {
  return camino.stages.flatMap((stage) => stage.nodes);
}

export function estadisticasCamino(camino: ClaseCamino): { completed: number; total: number } {
  const nodes = nodosDeCamino(camino);
  return { completed: nodes.filter((node) => node.estado === "COMPLETED").length, total: nodes.length };
}

export function nodoActualDelCamino(camino: ClaseCamino): NodoLeccion | null {
  const nodes = nodosDeCamino(camino);
  return nodes.find((node) => node.estado === "IN_PROGRESS") ?? nodes.find((node) => node.estado === "AVAILABLE") ?? null;
}

export function estadoRutaGlobal(stageIndex: number): string {
  return stageIndex % 2 === 0 ? "M 16 50 C 31 18, 69 82, 84 50" : "M 84 50 C 69 18, 31 82, 16 50";
}

export function flujoEtapa(stageIndex: number): "forward" | "back" {
  return stageIndex % 2 === 0 ? "forward" : "back";
}

export function puenteEntreEtapas(stageIndex: number): string {
  return stageIndex % 2 === 1 ? "M84 0 C84 55 16 45 16 100" : "M16 0 C16 55 84 45 84 100";
}