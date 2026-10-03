export const TROPHY_METRICS = [
  { key: "impact", label: "Participación en el ecosistema", unit: "" },
  { key: "sessions", label: "Sesiones asistidas", unit: "" },
  { key: "hours", label: "Horas validadas", unit: "h" },
  { key: "activeDays", label: "Días activos del período", unit: "" },
  { key: "streak", label: "Racha actual", unit: "días" },
  { key: "coins", label: "Crack Coins", unit: "" },
  { key: "xp", label: "XP total", unit: "" },
  { key: "bottles", label: "Botellas recicladas", unit: "" },
  { key: "kg", label: "KG reciclados", unit: "kg" },
] as const;

export type TrophyMetricKey = (typeof TROPHY_METRICS)[number]["key"];

export const TROPHY_METRIC_KEYS = TROPHY_METRICS.map((metric) => metric.key) as TrophyMetricKey[];

export function isTrophyMetric(value: unknown): value is TrophyMetricKey {
  return typeof value === "string" && (TROPHY_METRIC_KEYS as string[]).includes(value);
}

export function metricLabel(key: string): string {
  return TROPHY_METRICS.find((metric) => metric.key === key)?.label ?? key;
}

export function metricUnit(key: string): string {
  return TROPHY_METRICS.find((metric) => metric.key === key)?.unit ?? "";
}

export type TrophyProgress = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  metric: string;
  metricLabel: string;
  unit: string;
  target: number;
  current: number;
  earned: boolean;
  earnedAt: string | null;
  percent: number;
};
