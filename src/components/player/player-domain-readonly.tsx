"use client";

import type { PlayerStreakView, PlayerPetView, PlayerCoinsView } from "@/lib/player/domain-view";

const COLORS = {
  text: "#E8E4DA",
  sub: "#AAA69C",
  accent: "#C9A24A",
  green: "#3E9E5C",
  red: "#D2694A",
  blue: "#4A90B8",
  gold: "#C9A24A",
  surface: "#080909",
  border: "rgba(255,255,255,0.08)",
};

const COMPONENT_LABEL: Record<string, string> = {
  attendance: "Asistencia",
  neurocracks: "NeuroCracks",
  challenge: "Retos",
  pet: "PET",
  validation: "Validación",
};

function pct(v: number | null) {
  if (v === null) return "PENDIENTE";
  return `${Math.round(v)}%`;
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  return <span className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: color + "50", color }}>{status}</span>;
}

export function PlayerStreakSection({ view }: { view: PlayerStreakView }) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: COLORS.sub }}>Tu Racha</h2>
        {view.latest ? (
          <div className="mt-3 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold tabular-nums" style={{ color: COLORS.accent }}>{view.latest.score !== null ? `${Math.round(view.latest.score)}` : "—"}</span>
              <span className="text-[12px]" style={{ color: COLORS.sub }}>{view.latest.periodStart.toLocaleDateString("es-CO")} – {view.latest.periodEnd.toLocaleDateString("es-CO")}</span>
              <StatusBadge status={view.latest.verifiedWeek ? "VERIFIED WEEK" : "NO VERIFICADA"} color={view.latest.verifiedWeek ? COLORS.green : COLORS.sub} />
              <span className="ml-auto rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: COLORS.border, color: view.latest.calculationStatus === "FINAL" ? COLORS.green : view.latest.calculationStatus === "PREVIEW" ? COLORS.accent : COLORS.sub }}>
                {view.latest.calculationStatus}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {(Object.entries(view.latest.components) as [string, number | null][]).map(([key, value]) => (
                <div key={key} className="rounded-lg border p-3" style={{ borderColor: COLORS.border }}>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>{COMPONENT_LABEL[key] ?? key}</div>
                  <div className={`mt-1 text-[16px] font-bold tabular-nums ${value === null ? "" : ""}`} style={{ color: value === null ? COLORS.sub : value >= 60 ? COLORS.green : COLORS.accent }}>{pct(value)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[12px]" style={{ color: COLORS.sub }}>Sin resultados de racha aún.</p>
        )}
      </div>
      {view.history.length > 1 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>Histórico</h3>
          <div className="mt-2 space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {view.history.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border }}>
                <span className="text-[11px]" style={{ color: COLORS.sub }}>{row.periodStart.toLocaleDateString("es-CO")} – {row.periodEnd.toLocaleDateString("es-CO")}</span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: row.score !== null ? COLORS.accent : COLORS.sub }}>{row.score !== null ? `${Math.round(row.score)}` : "—"}</span>
                <StatusBadge status={row.verifiedWeek ? "VERIFIED" : "NO"} color={row.verifiedWeek ? COLORS.green : COLORS.sub} />
              </div>
            ))}
          </div>
        </div>
      )}
      {view.evidence.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>Evidencia reciente</h3>
          <div className="mt-2 space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {view.evidence.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-[11px]" style={{ borderColor: COLORS.border }}>
                <span className="font-medium" style={{ color: COLORS.text }}>{e.type}</span>
                <StatusBadge status={e.status} color={e.status === "VERIFIED" ? COLORS.green : e.status === "REJECTED" ? COLORS.red : COLORS.sub} />
                <span style={{ color: COLORS.sub }}>{e.occurredAt.toLocaleDateString("es-CO")}</span>
                {e.validatedBy ? <span style={{ color: COLORS.sub }}>visto por {e.validatedBy.slice(0, 8)}…</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const PET_STATUS_COLOR: Record<string, string> = {
  COLLECTED: COLORS.accent,
  IN_BATCH: COLORS.blue,
  CANCELLED: COLORS.red,
};

export function PlayerPetSection({ view }: { view: PlayerPetView }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: COLORS.sub }}>Tu PET</h2>
        <div className="mt-3 flex gap-4">
          <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>Botellas totales</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: COLORS.accent }}>{view.totalBottles.toLocaleString("es-CO")}</div>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>Kg estimados</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: COLORS.green }}>{view.totalEstimatedKg.toLocaleString("es-CO", { maximumFractionDigits: 1 })}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {view.contributions.length === 0 ? <p className="text-[12px]" style={{ color: COLORS.sub }}>Sin contribuciones PET registradas.</p> : null}
        {view.contributions.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5" style={{ borderColor: COLORS.border }}>
            <span className="text-[12px] font-medium" style={{ color: COLORS.text }}>{c.bottlesCount} botellas</span>
            {c.estimatedKg !== null ? <span className="text-[11px]" style={{ color: COLORS.sub }}>{c.estimatedKg} kg est</span> : null}
            <span className="text-[11px]" style={{ color: COLORS.sub }}>{c.recordedAt.toLocaleDateString("es-CO")}</span>
            {c.batchCode ? <span className="text-[11px]" style={{ color: COLORS.blue }}>lote {c.batchCode}</span> : null}
            <span className="ml-auto rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: (PET_STATUS_COLOR[c.status] ?? COLORS.sub) + "50", color: PET_STATUS_COLOR[c.status] ?? COLORS.sub }}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const COIN_STATUS_COLOR: Record<string, string> = {
  POSTED: COLORS.green,
  REVERSED: COLORS.red,
  PENDING: COLORS.sub,
  VOID: COLORS.sub,
};

export function PlayerCoinsSection({ view }: { view: PlayerCoinsView }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: COLORS.sub }}>Tus Crack Coins</h2>
        <div className="mt-3 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: COLORS.sub }}>Saldo</div>
          <div className="mt-1 text-[28px] font-bold tabular-nums" style={{ color: view.balance >= 0 ? COLORS.gold : COLORS.red }}>
            {view.balance.toLocaleString("es-CO")} CC
          </div>
        </div>
      </div>
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
        {view.ledger.length === 0 ? <p className="text-[12px]" style={{ color: COLORS.sub }}>Sin movimientos de monedas.</p> : null}
        {view.ledger.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5" style={{ borderColor: COLORS.border }}>
            <span className="text-[11px] font-medium" style={{ color: COLORS.text }}>{l.sourceType}</span>
            <span className={`text-[13px] font-semibold tabular-nums ${l.coinDelta >= 0 ? "" : ""}`} style={{ color: l.coinDelta >= 0 ? COLORS.green : COLORS.red }}>
              {l.coinDelta > 0 ? `+${l.coinDelta}` : l.coinDelta} CC
            </span>
            <span className="text-[11px]" style={{ color: COLORS.sub }}>{l.occurredAt.toLocaleDateString("es-CO")}</span>
            {l.reversalOfId ? <span className="text-[9px] uppercase tracking-wider" style={{ color: COLORS.red }}>reverso</span> : null}
            <StatusBadge status={l.status} color={COIN_STATUS_COLOR[l.status] ?? COLORS.sub} />
            {l.notes ? <span className="ml-auto text-[10px] truncate max-w-[140px]" style={{ color: COLORS.sub }}>{l.notes}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}