import "server-only";

import { seriesFor, type IndicatorRow } from "./metrics";

export const PLAYER_CERTIFICATION_TARGET_HOURS = 540;

export interface PlayerProgressDimension {
  id: string;
  label: string;
  current: number;
  previous: number;
}

export interface PlayerProgressSeries {
  label: "Deporte" | "NeuroCracks";
  accent: "cyan" | "violet";
  dimensions: readonly PlayerProgressDimension[];
}

export interface PlayerProgressFixture {
  sport: PlayerProgressSeries;
  neurocracks: PlayerProgressSeries;
  indicators: readonly { id: string; label: string; value: string; detail: string }[];
  trend: readonly { label: string; value: number }[];
  strengths: readonly { label: string; value: number; note: string }[];
  improve: readonly { label: string; value: number; note: string }[];
  coachFeedback: { message: string; context: string; dateLabel: string; dimension: string } | null;
  hours: { validated: number; target: number; recent: string };
  evaluations: readonly { title: string; dateLabel: string; context: string }[];
  rpg: PlayerProgressRpg;
}

export interface PlayerRpgQuest {
  readonly id: string;
  readonly title: string;
  readonly progress: number;
  readonly target: number;
  readonly sourceLabel: string;
  readonly state: "VERIFIED" | "IN_PROGRESS";
  readonly detail: string;
}

export interface PlayerProgressRpg {
  readonly nextMilestone: number;
  readonly streakCurrent: number;
  readonly streakBest: number;
  readonly nextRewardTitle: string;
  readonly nextRewardDetail: string;
  readonly quests: readonly PlayerRpgQuest[];
}

export type PlayerProgressRachaState = "ACTIVA" | "INTERRUMPIDA" | "SIN_RACHA";

export interface PlayerProgressRacha {
  state: PlayerProgressRachaState;
  currentStreak: number | null;
  bestStreak: number | null;
  lastVerifiedActivityDate?: string;
  nextMilestone: number | null;
  explanation: string;
}

const sportLabels = ["Técnica", "Velocidad", "Resistencia", "Coordinación", "Decisión", "Lectura de juego"] as const;
const neuroLabels = ["Atención", "Memoria", "Flexibilidad", "Inhibición", "Planificación", "Velocidad mental"] as const;

function dimensions(labels: readonly string[], current: readonly number[], previous: readonly number[]) {
  return labels.map((label, index) => ({ id: label.toLowerCase().replaceAll(" ", "-"), label, current: current[index], previous: previous[index] }));
}

export interface BuildPlayerProgressInput {
  indicators: IndicatorRow[];
  currentStreak: number;
  bestStreak: number;
}

export function buildPlayerProgressFixture(input: BuildPlayerProgressInput): PlayerProgressFixture {
  const sport = dimensions(sportLabels, seriesFor("DEPORTE", input.indicators).current, seriesFor("DEPORTE", input.indicators).previous);
  const neurocracks = dimensions(neuroLabels, seriesFor("NEUROCRACKS", input.indicators).current, seriesFor("NEUROCRACKS", input.indicators).previous);
  const validated = 0;

  return {
    sport: { label: "Deporte", accent: "cyan", dimensions: sport },
    neurocracks: { label: "NeuroCracks", accent: "violet", dimensions: neurocracks },
    indicators: [
      { id: "attendance", label: "Asistencia", value: "92%", detail: "último período" },
      { id: "consistency", label: "Consistencia", value: String(input.currentStreak), detail: "días" },
      { id: "validated-hours", label: "Horas validadas", value: String(validated), detail: `/ ${PLAYER_CERTIFICATION_TARGET_HOURS} h` },
      { id: "evaluations", label: "Evaluaciones", value: "4", detail: "registradas" },
    ],
    trend: [
      { label: "Abr", value: 61 },
      { label: "May", value: 65 },
      { label: "Jun", value: 69 },
      { label: "Jul", value: 73 },
      { label: "Ago", value: Math.round(sport.reduce((sum, item) => sum + item.current, 0) / sport.length) },
    ],
    strengths: [
      { label: sport[1].label, value: sport[1].current, note: "Evolución positiva" },
      { label: sport[2].label, value: sport[2].current, note: "Sostienes el ritmo" },
    ],
    improve: [
      { label: sport[4].label, value: sport[4].current, note: "Objetivo actual" },
      { label: neurocracks[4].label, value: neurocracks[4].current, note: "Reforzar en sesión" },
    ],
    coachFeedback: {
      message: "Sigue trabajando tu próximo objetivo técnico y comprime los tiempos de decisión en cada posesión.",
      context: "Seguimiento reciente",
      dateLabel: "12 ago 2026",
      dimension: "Desarrollo técnico",
    },
    hours: { validated, target: PLAYER_CERTIFICATION_TARGET_HOURS, recent: "Acumulado calculado desde sesiones validadas" },
    evaluations: [
      { title: "Entrenamiento técnico", dateLabel: "12 ago 2026", context: "Técnica · sesión de campo" },
      { title: "Evaluación de rendimiento", dateLabel: "29 jul 2026", context: "Deporte · período anterior" },
      { title: "Revisión NeuroCracks", dateLabel: "15 jul 2026", context: "Atención y decisión" },
    ],
    rpg: {
      nextMilestone: input.currentStreak > 0 ? (Math.floor(input.currentStreak / 5) + 1) * 5 : 5,
      streakCurrent: input.currentStreak,
      streakBest: input.bestStreak,
      nextRewardTitle: "Experiencia de estadio",
      nextRewardDetail: "Al llegar a 10 días de actividad validada desbloqueas una nueva recompensa. Desbloquearla no significa ser seleccionado.",
      quests: [
        { id: "quest-attendance", title: "Asistir a entrenamiento", progress: input.currentStreak > 0 ? 1 : 0, target: 2, sourceLabel: "Asistencia validada", state: "IN_PROGRESS", detail: "La asistencia registrada sostiene tu continuidad." },
        { id: "quest-bilingual", title: "Continúa Bilingüismo Sport", progress: 0, target: 1, sourceLabel: "Actividad NeuroCracks", state: "IN_PROGRESS", detail: "Completa una actividad verificable para avanzar." },
        { id: "quest-pet", title: "Mantén tu aporte PET", progress: input.currentStreak > 0 ? 1 : 0, target: 1, sourceLabel: "PET validado", state: input.currentStreak > 0 ? "VERIFIED" : "IN_PROGRESS", detail: input.currentStreak > 0 ? "Tu aporte PET ya aparece verificado." : "Completa una actividad PET para avanzar." },
      ],
    },
  };
}