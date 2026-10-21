export type PoseId = "standing" | "celebrate" | "jump" | "kick" | "dribble";

export type AvatarGender = "male" | "female";

export const AVATAR_GENDERS = [
  { id: "male", label: "Hombre" },
  { id: "female", label: "Mujer" },
] as const;

export type AvatarConfig = {
  gender: AvatarGender;
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  pose: PoseId;
  jersey: string;
  jerseyPattern: string;
  hoodie: string;
  hoodiePattern: string;
  shorts: string;
  shortsPattern: string;
  socks: string;
  boots: string;
  number: number;
  numberBack: boolean;
  shield: string;
  shieldUrl: string | null;
  accessory: string;
  background: string;
  /** Id del asset GLB que ocupa el slot "cuerpo" (ver public/models/avatares/manifest.json). */
  modelo: string | null;
  /**
   * Id del asset GLB que ocupa el slot "cabello". Si es null se dibuja el pelo
   * procedural de `hair`. Los GLB traen el color horneado en la textura, asi que
   * `hairColor` no los tiñe.
   */
  cabello: string | null;
};

export const SKIN_TONES = [
  "#ffe0bd",
  "#fbd5b5",
  "#f1c27d",
  "#e8b878",
  "#e0ac69",
  "#d59b5c",
  "#c68642",
  "#b0703c",
  "#8d5524",
  "#7a4526",
  "#5a3a22",
  "#3b2f2f",
] as const;

export const HAIR_STYLES = [
  { id: "none", label: "Sin pelo" },
  { id: "short", label: "Corto" },
  { id: "fringe", label: "Flequillo" },
  { id: "spiky", label: "Espigado" },
  { id: "side", label: "Lateral" },
  { id: "afro", label: "Afro" },
  { id: "curly", label: "Rizado" },
  { id: "long", label: "Largo" },
  { id: "bun", label: "Moño" },
  { id: "ponytail", label: "Coleta" },
] as const;

export const HAIR_COLORS = [
  "#0c0a09",
  "#3b2f2f",
  "#7c4a1e",
  "#b45309",
  "#eab308",
  "#f59e0b",
  "#ef4444",
  "#94a3b8",
  "#f8fafc",
] as const;

export const EYE_STYLES = [
  { id: "normal", label: "Normales" },
  { id: "round", label: "Grandes" },
  { id: "closed", label: "Cerrados" },
] as const;

export const MOUTH_STYLES = [
  { id: "smile", label: "Sonrisa" },
  { id: "smirk", label: "Picara" },
  { id: "laugh", label: "Risa" },
  { id: "grin", label: "Dientes" },
  { id: "shy", label: "Timida" },
  { id: "neutral", label: "Serio" },
] as const;

export const POSE_STYLES = [
  { id: "standing", label: "De pie" },
  { id: "celebrate", label: "Celebrando" },
  { id: "jump", label: "Saltando" },
  { id: "kick", label: "Disparando" },
  { id: "dribble", label: "Regateando" },
] as const;

export const KIT_COLORS = [
  "#16a34a",
  "#2563eb",
  "#dc2626",
  "#ea580c",
  "#7c3aed",
  "#0ea5e9",
  "#facc15",
  "#111827",
  "#f8fafc",
  "#ec4899",
  "#64748b",
  "#84cc16",
] as const;

/**
 * Unico estado de pelo sin asset. Los cuerpos GLB son calvos, asi que el pelo
 * visible viene siempre de un asset (cab1/cab2) y los peinados procedurales
 * quedaron obsoletos: siguen en HAIR_STYLES solo para validar configs ya
 * guardados, pero la UI ya no los ofrece.
 */
export const SIN_PELO = { id: "none", label: "Sin pelo" } as const;

export const UNIFORM_PRESETS = [
  { id: "clasico", label: "Clásico", jersey: "#16a34a", shorts: "#f8fafc", socks: "#16a34a" },
  { id: "local", label: "Local", jersey: "#2563eb", shorts: "#f8fafc", socks: "#f8fafc" },
  { id: "visitante", label: "Visitante", jersey: "#f8fafc", shorts: "#111827", socks: "#111827" },
  { id: "rojo", label: "Rojo", jersey: "#dc2626", shorts: "#dc2626", socks: "#dc2626" },
  { id: "negro", label: "Negro", jersey: "#111827", shorts: "#111827", socks: "#111827" },
  { id: "dorado", label: "Dorado", jersey: "#facc15", shorts: "#111827", socks: "#facc15" },
] as const;

export const SHIELDS = [
  { id: "none", emoji: "—", label: "Sin escudo" },
  { id: "star", emoji: "⭐", label: "Estrella" },
  { id: "ball", emoji: "⚽", label: "Balón" },
  { id: "bolt", emoji: "⚡", label: "Rayo" },
  { id: "crown", emoji: "👑", label: "Corona" },
  { id: "flame", emoji: "🔥", label: "Fuego" },
  { id: "heart", emoji: "💚", label: "Corazón" },
  { id: "custom", emoji: "🖼️", label: "Mi escudo" },
] as const;

export const ACCESSORIES = [
  { id: "none", label: "Ninguno" },
  { id: "headband", label: "Cinta" },
  { id: "cap", label: "Cachucha" },
  { id: "beanie", label: "Gorro" },
] as const;

export const HOODIE_NONE = "none";

export const GARMENT_PATTERNS = [
  { id: "none", label: "Lisa" },
  { id: "vstripes", label: "Rayas" },
  { id: "hstripes", label: "Aros" },
  { id: "checkers", label: "Cuadros" },
  { id: "diagonal", label: "Diagonal" },
] as const;

export const BACKGROUNDS = [
  "#111827",
  "#14532d",
  "#1e3a8a",
  "#7f1d1d",
  "#4c1d95",
  "#0f766e",
  "#eab308",
  "#f8fafc",
] as const;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  gender: "male",
  skin: "#f1c27d",
  hair: "short",
  hairColor: "#3b2f2f",
  eyes: "normal",
  mouth: "smile",
  pose: "standing",
  jersey: "#16a34a",
  jerseyPattern: "none",
  hoodie: "none",
  hoodiePattern: "none",
  shorts: "#f8fafc",
  shortsPattern: "none",
  socks: "#16a34a",
  boots: "#111827",
  number: 10,
  numberBack: false,
  shield: "none",
  shieldUrl: null,
  accessory: "none",
  background: "#111827",
  modelo: null,
  cabello: null,
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const SKIN_SET = new Set<string>(SKIN_TONES);
const HAIR_COLOR_SET = new Set<string>(HAIR_COLORS);
const KIT_SET = new Set<string>(KIT_COLORS);
const BG_SET = new Set<string>(BACKGROUNDS);

const GENDER_ID_SET = new Set(AVATAR_GENDERS.map((s) => s.id));
const PATTERN_ID_SET = new Set(GARMENT_PATTERNS.map((s) => s.id));
const HAIR_ID_SET = new Set(HAIR_STYLES.map((s) => s.id));
const EYE_ID_SET = new Set(EYE_STYLES.map((s) => s.id));
const MOUTH_ID_SET = new Set(MOUTH_STYLES.map((s) => s.id));
const POSE_ID_SET = new Set(POSE_STYLES.map((s) => s.id));
const SHIELD_ID_SET = new Set(SHIELDS.map((s) => s.id));
const ACC_ID_SET = new Set(ACCESSORIES.map((s) => s.id));
const ASSET_ID_RE = /^[a-z0-9-]{1,64}$/;

/** Los ids de asset validan contra el manifiesto en tiempo de carga, aqui solo el formato. */
function idAsset(value: unknown): string | null {
  const s = typeof value === "string" ? value : "";
  return ASSET_ID_RE.test(s) ? s : null;
}

function inSet(value: unknown, set: Set<string>, fallback: string): string {
  const s = String(value ?? "");
  return set.has(s) && HEX_RE.test(s) ? s : fallback;
}

function inIds(value: unknown, ids: Set<string>, fallback: string): string {
  const s = String(value ?? "");
  return ids.has(s) ? s : fallback;
}

export function parseAvatarConfig(value: unknown): AvatarConfig | null {
  const config = validateAvatarConfig(value);
  return config ?? null;
}

export function validateAvatarConfig(value: unknown): AvatarConfig | null {
  if (typeof value !== "object" || value === null) return null;

  const c = value as Record<string, unknown>;
  const num = Number(c.number);
  const d = DEFAULT_AVATAR_CONFIG;
  const shieldUrl =
    typeof c.shieldUrl === "string" && c.shieldUrl.startsWith("/uploads/")
      ? c.shieldUrl
      : null;

  return {
    gender: inIds(c.gender, GENDER_ID_SET, d.gender) as AvatarGender,
    skin: inSet(c.skin, SKIN_SET, d.skin),
    hair: inIds(c.hair, HAIR_ID_SET, d.hair),
    hairColor: inSet(c.hairColor, HAIR_COLOR_SET, d.hairColor),
    eyes: inIds(c.eyes, EYE_ID_SET, d.eyes),
    mouth: inIds(c.mouth, MOUTH_ID_SET, d.mouth),
    pose: inIds(c.pose, POSE_ID_SET, d.pose) as PoseId,
    jersey: inSet(c.jersey, KIT_SET, d.jersey),
    jerseyPattern: inIds(c.jerseyPattern, PATTERN_ID_SET, d.jerseyPattern),
    hoodie: c.hoodie === HOODIE_NONE ? HOODIE_NONE : inSet(c.hoodie, KIT_SET, d.hoodie),
    hoodiePattern: inIds(c.hoodiePattern, PATTERN_ID_SET, d.hoodiePattern),
    shorts: inSet(c.shorts, KIT_SET, d.shorts),
    shortsPattern: inIds(c.shortsPattern, PATTERN_ID_SET, d.shortsPattern),
    socks: inSet(c.socks, KIT_SET, d.socks),
    boots: inSet(c.boots, KIT_SET, d.boots),
    number:
      Number.isInteger(num) && num >= 1 && num <= 99 ? num : d.number,
    numberBack: c.numberBack === true,
    shield: inIds(c.shield, SHIELD_ID_SET, d.shield),
    shieldUrl,
    accessory: inIds(c.accessory, ACC_ID_SET, d.accessory),
    background: inSet(c.background, BG_SET, d.background),
    modelo: idAsset(c.modelo),
    cabello: idAsset(c.cabello),
  };
}
