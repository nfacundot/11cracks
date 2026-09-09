export const activationCategories = ["PUBLICIDAD", "DONATIVOS", "EVENTOS", "EVENTOS_AMBIENTALES", "VENTAS"] as const;
export type ActivationCategory = (typeof activationCategories)[number];
export const activationStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ActivationStatus = (typeof activationStatuses)[number];
export const activationEnvironments = ["EL_CAMINO", "PLAYER_HOME", "VESTUARIO", "ENTRENAMIENTO", "GASTRONOMIA", "HOTEL", "ESTADIO"] as const;

export interface ActivationRecord {
  id: string;
  name: string;
  category: ActivationCategory;
  partnerName: string | null;
  organizationId: string;
  clubId: string | null;
  validity: { from: string; until: string | null };
  status: ActivationStatus;
  environments: readonly string[];
  placements: readonly string[];
  responsibleActorId: string;
  demoOnly: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationDraft {
  id?: string;
  name: string;
  category: ActivationCategory;
  partnerName?: string | null;
  organizationId: string;
  clubId?: string | null;
  validFrom: string;
  validUntil?: string | null;
  status: ActivationStatus;
  environments?: readonly string[];
  placements?: readonly string[];
  responsibleActorId: string;
  demoOnly?: boolean;
  source?: string;
}

export const DEMO_ACTIVATIONS: readonly ActivationRecord[] = [
  demo("activation-demo-nike", "Nike — Tiempo de Entrenar", "PUBLICIDAD", "Nike", ["VESTUARIO", "ENTRENAMIENTO"], ["LOCKER_PANEL"]),
  demo("activation-demo-coca-cola", "Coca-Cola — Vive el Partido", "PUBLICIDAD", "Coca-Cola", ["ENTRENAMIENTO", "ESTADIO"], ["GOAL_SIDELINE_LEFT"]),
  demo("activation-demo-microsoft", "Microsoft — Tecnología para Crecer", "DONATIVOS", "Microsoft"),
  demo("activation-demo-fundacion", "Fundación Demo X — Cantera Educativa", "DONATIVOS", "Fundación Demo X"),
  demo("activation-demo-subasta", "Subasta Camisetas de Crack", "EVENTOS", null),
  demo("activation-demo-clinica", "Clínica con exjugadores", "EVENTOS", null),
  demo("activation-demo-botellas", "Reto 100K Botellas", "EVENTOS_AMBIENTALES", null),
  demo("activation-demo-cancha", "Cancha Limpia", "EVENTOS_AMBIENTALES", null),
  demo("activation-demo-camiseta", "Camiseta Edición Club 2026", "VENTAS", null),
  demo("activation-demo-botella-11", "Botella reutilizable 11 Cracks", "VENTAS", null),
];

function demo(id: string, name: string, category: ActivationCategory, partnerName: string | null, environments?: readonly string[], placements?: readonly string[]): ActivationRecord {
  return { id, name, category, partnerName, organizationId: "org-demo-rionegro", clubId: "club-demo-forjadores", validity: { from: "2026-08-01", until: "2026-12-31" }, status: "PUBLISHED", environments: environments ?? ["CLUB"], placements: placements ?? [], responsibleActorId: "system:demo", demoOnly: true, source: "DEMO_FIXTURE", createdAt: "2026-08-01T12:00:00.000Z", updatedAt: "2026-08-01T12:00:00.000Z" };
}

export function getActivationRecords(records?: readonly ActivationRecord[]): readonly ActivationRecord[] {
  return records?.length ? records : DEMO_ACTIVATIONS;
}

export function createActivation(input: ActivationDraft, now = new Date().toISOString()): ActivationRecord {
  validate(input);
  return { id: input.id ?? `activation:${now.replace(/[^0-9]/g, "")}`, name: input.name.trim(), category: input.category, partnerName: input.partnerName?.trim() || null, organizationId: input.organizationId, clubId: input.clubId?.trim() || null, validity: { from: input.validFrom, until: input.validUntil?.trim() || null }, status: input.status, environments: Object.freeze([...(input.environments ?? [])]), placements: Object.freeze([...(input.placements ?? [])]), responsibleActorId: input.responsibleActorId, demoOnly: input.demoOnly ?? false, source: input.source ?? "AUTHORIZED_UI", createdAt: now, updatedAt: now };
}

export function updateActivation(current: ActivationRecord, input: ActivationDraft, now = new Date().toISOString()): ActivationRecord {
  const next = createActivation({ ...input, id: current.id, organizationId: current.organizationId, responsibleActorId: input.responsibleActorId || current.responsibleActorId, demoOnly: current.demoOnly, source: current.source }, now);
  return { ...current, ...next, createdAt: current.createdAt };
}

function validate(input: ActivationDraft): void {
  if (!input.name.trim()) throw new Error("El nombre de la activación es obligatorio.");
  if (!activationCategories.includes(input.category)) throw new Error("La categoría de activación no es válida.");
  if (!activationStatuses.includes(input.status)) throw new Error("El estado de activación no es válido.");
  if (!input.organizationId.trim()) throw new Error("La organización es obligatoria.");
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.validFrom)) throw new Error("La fecha de inicio no es válida.");
  if (input.validUntil && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.validUntil) || input.validUntil < input.validFrom)) throw new Error("La vigencia de la activación no es válida.");
}
