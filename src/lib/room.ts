export type RoomSizeKey = "studio" | "loft" | "duplex" | "suite" | "atico" | "villa";

export interface RoomSize {
  key: RoomSizeKey;
  label: string;
  description: string;
  width: number;
  depth: number;
  height: number;
}

export const ROOM_SIZES: RoomSize[] = [
  { key: "studio", label: "Estudio", description: "Compacto y acogedor", width: 15, depth: 15, height: 4.4 },
  { key: "loft", label: "Loft", description: "Amplio y abierto", width: 24, depth: 15, height: 5.4 },
  { key: "duplex", label: "Dúplex", description: "Dos alturas", width: 18, depth: 18, height: 8.8 },
  { key: "suite", label: "Suite", description: "Cuadrado y luminoso", width: 21, depth: 21, height: 5.1 },
  { key: "atico", label: "Ático", description: "Vistas panorámicas", width: 27, depth: 18, height: 5.8 },
  { key: "villa", label: "Villa", description: "El más espacioso", width: 30, depth: 24, height: 6.1 },
];

export const DEFAULT_FLOOR_COLOR = "#b98a4a";
export const DEFAULT_WALL_COLOR = "#2f6fb0";

export function roomSizeByKey(key: string): RoomSize {
  return ROOM_SIZES.find((size) => size.key === key) ?? ROOM_SIZES[0];
}

/* ---------- Muebles ---------- */

export interface FurnitureCategory {
  key: string;
  label: string;
  emoji: string;
}

export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  { key: "dormitorio", label: "Dormitorio", emoji: "🛏️" },
  { key: "salon", label: "Salón", emoji: "🛋️" },
  { key: "comedor", label: "Comedor", emoji: "🍽️" },
  { key: "iluminacion", label: "Iluminación", emoji: "💡" },
  { key: "decoracion", label: "Decoración", emoji: "🖼️" },
  { key: "ventanas", label: "Ventanas", emoji: "🪟" },
  { key: "almacenaje", label: "Almacenaje", emoji: "🗄️" },
  { key: "bano", label: "Baño", emoji: "🚿" },
  { key: "cocina", label: "Cocina", emoji: "🍔" },
];

export interface FurnitureDef {
  id: string;
  label: string;
  category: string;
  price: number;
  kind: "floor" | "wall";
  model: string;
  size: number;
  emoji: string;
  tint?: number;
  view?: string;
  color?: string;
}

export const WINDOW_VIEWS = [
  { key: "city_day", label: "Ciudad día", sky: "#9fb6cc", ground: "#3f9b45" },
  { key: "city_night", label: "Ciudad noche", sky: "#0a1020", ground: "#1b2430" },
  { key: "beach", label: "Playa", sky: "#7fd3f7", ground: "#e8d7a0" },
  { key: "space", label: "Espacio", sky: "#0b0620", ground: "#241a4a" },
] as const;

export const FURNITURE_CATALOG: FurnitureDef[] = [
  { id: "bed_classic", label: "Cama clásica", category: "dormitorio", price: 0, kind: "floor", model: "/models/furnitures/Bed.fbx", size: 2.6, emoji: "🛏️", tint: 0xb08968 },
  { id: "bed_modern", label: "Cama moderna", category: "dormitorio", price: 0, kind: "floor", model: "/models/furnitures/Bed.fbx", size: 2.6, emoji: "🛏️", tint: 0x6b7280 },
  { id: "bed_luxe", label: "Cama lujosa", category: "dormitorio", price: 0, kind: "floor", model: "/models/furnitures/Bed.fbx", size: 2.6, emoji: "🛏️", tint: 0x8b5cf6 },
  { id: "nightstand", label: "Nochero", category: "dormitorio", price: 0, kind: "floor", model: "/models/furnitures/Nightstand.fbx", size: 0.7, emoji: "🗄️" },

  { id: "sofa_3", label: "Sofá 3 plazas", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/3SeaterSofa.fbx", size: 2.6, emoji: "🛋️" },
  { id: "sofa_2", label: "Sofá 2 plazas", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/2SeaterSofa.fbx", size: 2.0, emoji: "🛋️" },
  { id: "armchair", label: "Sillón", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/Armchair.fbx", size: 1.2, emoji: "💺" },
  { id: "coffee_table", label: "Mesa de centro", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/Coffee_Table.fbx", size: 1.5, emoji: "🪑" },
  { id: "tv", label: "Televisor", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/Tv.fbx", size: 1.7, emoji: "📺" },
  { id: "tv_stand", label: "Mueble TV", category: "salon", price: 0, kind: "floor", model: "/models/furnitures/Tv_stand.fbx", size: 1.8, emoji: "🗄️" },

  { id: "dining_table", label: "Mesa comedor", category: "comedor", price: 0, kind: "floor", model: "/models/furnitures/Dining_table.fbx", size: 2.0, emoji: "🍽️" },
  { id: "dining_chair", label: "Silla comedor", category: "comedor", price: 0, kind: "floor", model: "/models/furnitures/Dining_chair.fbx", size: 0.7, emoji: "🪑" },
  { id: "chair", label: "Silla", category: "comedor", price: 0, kind: "floor", model: "/models/furnitures/Chair.fbx", size: 0.9, emoji: "💺" },

  { id: "floor_lamp", label: "Lámpara de pie", category: "iluminacion", price: 0, kind: "floor", model: "/models/furnitures/FloorLamp.fbx", size: 0.9, emoji: "💡" },
  { id: "table_lamp", label: "Lámpara de mesa", category: "iluminacion", price: 0, kind: "floor", model: "/models/furnitures/TableLamp.fbx", size: 0.5, emoji: "💡" },

  { id: "carpet", label: "Alfombra", category: "decoracion", price: 0, kind: "floor", model: "/models/furnitures/Carpet.fbx", size: 3, emoji: "🟩" },
  { id: "plant", label: "Planta", category: "decoracion", price: 0, kind: "floor", model: "/models/furnitures/Plant.fbx", size: 1, emoji: "🪴" },
  { id: "poster_1", label: "Afiche fútbol", category: "decoracion", price: 0, kind: "wall", model: "poster", size: 1.2, emoji: "⚽", color: "#e11d48" },
  { id: "poster_2", label: "Afiche trofeo", category: "decoracion", price: 0, kind: "wall", model: "poster", size: 1.2, emoji: "🏆", color: "#0ea5e9" },
  { id: "poster_3", label: "Afiche crack", category: "decoracion", price: 0, kind: "wall", model: "poster", size: 1.2, emoji: "🐐", color: "#22c55e" },

  { id: "window_small", label: "Ventana pequeña", category: "ventanas", price: 0, kind: "wall", model: "window", size: 1.4, emoji: "🪟", view: "city_day" },
  { id: "window_1", label: "Ventana", category: "ventanas", price: 0, kind: "wall", model: "window", size: 2.2, emoji: "🪟", view: "city_day" },
  { id: "window_large", label: "Ventanal", category: "ventanas", price: 0, kind: "wall", model: "window", size: 3, emoji: "🪟", view: "beach" },
  { id: "window_tall", label: "Ventana alta", category: "ventanas", price: 0, kind: "wall", model: "window", size: 2.6, emoji: "🪟", view: "space" },
  { id: "window_pano", label: "Panorámica", category: "ventanas", price: 0, kind: "wall", model: "window", size: 3.6, emoji: "🪟", view: "city_night" },

  { id: "library", label: "Estantería", category: "almacenaje", price: 0, kind: "floor", model: "/models/furnitures/Library.fbx", size: 1.4, emoji: "🗄️" },
  { id: "console", label: "Consola", category: "almacenaje", price: 0, kind: "floor", model: "/models/furnitures/Console.fbx", size: 1.8, emoji: "🚪" },
  { id: "desk", label: "Escritorio", category: "almacenaje", price: 0, kind: "floor", model: "/models/furnitures/Desk.fbx", size: 1.6, emoji: "🖥️" },

  { id: "sink", label: "Lavamanos", category: "bano", price: 0, kind: "floor", model: "sink", size: 0.9, emoji: "🚰" },
  { id: "bathtub", label: "Bañera", category: "bano", price: 0, kind: "floor", model: "bathtub", size: 1.8, emoji: "🛁" },
  { id: "toilet", label: "Inodoro", category: "bano", price: 0, kind: "floor", model: "toilet", size: 0.8, emoji: "🚽" },

  { id: "fridge", label: "Nevera", category: "cocina", price: 0, kind: "floor", model: "fridge", size: 1.1, emoji: "🧊" },
  { id: "water", label: "Dispensador de agua", category: "cocina", price: 0, kind: "floor", model: "water", size: 0.7, emoji: "💧" },
];

const FURNITURE_IDS = new Set<string>(FURNITURE_CATALOG.map((def) => def.id));

export function furnitureDef(id: string): FurnitureDef {
  return FURNITURE_CATALOG.find((def) => def.id === id) ?? FURNITURE_CATALOG[0];
}

export function furnitureByCategory(category: string): FurnitureDef[] {
  return FURNITURE_CATALOG.filter((def) => def.category === category);
}

export interface FurnitureItem {
  id: string;
  type: string;
  x: number;
  z: number;
  rotY: number;
  y?: number;
  view?: string;
}

export function parseFurniture(value: unknown): FurnitureItem[] {
  if (!Array.isArray(value)) return [];
  const items: FurnitureItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.type !== "string" || !FURNITURE_IDS.has(item.type)) continue;
    const x = Number(item.x);
    const z = Number(item.z);
    const rotY = Number(item.rotY);
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(rotY)) continue;
    const parsed: FurnitureItem = { id: item.id.slice(0, 64), type: item.type, x, z, rotY };
    if (typeof item.y === "number" && Number.isFinite(item.y)) parsed.y = item.y;
    if (typeof item.view === "string") parsed.view = item.view.slice(0, 24);
    items.push(parsed);
  }
  return items.slice(0, 200);
}

export interface RoomData {
  id: string;
  name: string;
  size: string;
  floorColor: string;
  wallColor: string;
  avatarX: number;
  avatarZ: number;
  avatarRot: number;
  furniture: FurnitureItem[];
}
