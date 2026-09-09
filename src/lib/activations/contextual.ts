import { getActivationRecords, type ActivationRecord } from "./domain";

export interface ContextualPlacement {
  activationId: string;
  brandName: string;
  campaignName: string;
  placement: string;
  demoOnly: boolean;
}

export interface ContextualPlacementQuery {
  environmentId: string;
  organizationId?: string;
  clubId?: string;
  language?: string;
  date?: string;
}

const MAX_PLACEMENTS = 3;

function inValidity(record: ActivationRecord, date: string): boolean {
  return record.validity.from <= date && (!record.validity.until || date <= record.validity.until);
}

export function resolveContextualPlacements(records: readonly ActivationRecord[] | undefined, query: ContextualPlacementQuery): readonly ContextualPlacement[] {
  const date = query.date ?? new Date().toISOString().slice(0, 10);
  const environment = query.environmentId.trim().toLocaleUpperCase();
  return getActivationRecords(records)
    .filter((record) => record.category === "PUBLICIDAD" && record.status === "PUBLISHED")
    .filter((record) => inValidity(record, date))
    .filter((record) => record.organizationId === query.organizationId)
    .filter((record) => !record.clubId || record.clubId === query.clubId)
    .filter((record) => record.environments.some((item) => item.toLocaleUpperCase() === environment))
    .flatMap((record) => record.placements.map((placement) => ({ activationId: record.id, brandName: record.partnerName ?? "Aliado no registrado", campaignName: record.name, placement, demoOnly: record.demoOnly })))
    .slice(0, MAX_PLACEMENTS);
}
