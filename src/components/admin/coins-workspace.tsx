"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { postCoinCorrectionAction } from "@/app/actions/coins";
import type { CoinsWorkspace, CoinLedgerRow, CoinEngineDecision } from "@/lib/coins/service";

type CoinMutationResult = CoinEngineDecision & { ledgerId?: string; droppedAsDuplicate?: boolean };

const SOURCE_LABEL: Record<string, string> = {
  PET: "PET",
  STREAK: "Racha",
  CORRECTION: "Corrección",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  POSTED: "Posteado",
  REVERSED: "Reversado",
  VOID: "Anulado",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#C89B32",
  POSTED: "#3E9E5C",
  REVERSED: "#D2694A",
  VOID: "#AAA69C",
};

function BalanceRow({ row }: { row: { clubName: string; playerName: string; balance: number } }) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
      <div className="flex flex-col">
        <span className="text-[12px] font-medium" style={{ color: S.textPrimary }}>{row.playerName}</span>
        <span className="text-[10px]" style={{ color: S.textSecondary }}>{row.clubName}</span>
      </div>
      <span className={`text-[14px] font-semibold tabular-nums ${row.balance >= 0 ? "" : ""}`} style={{ color: row.balance >= 0 ? "#C9A24A" : "#D2694A" }}>
        {row.balance.toLocaleString("es-CO")} CC
      </span>
    </div>
  );
}

function LedgerRowView({ row }: { row: CoinLedgerRow }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
      <span className="rounded-[8px] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: SOURCE_LABEL[row.sourceType] === "PET" ? "#7FA65A" : SOURCE_LABEL[row.sourceType] === "Racha" ? "#4A90B8" : S.textPrimary }}>
        {SOURCE_LABEL[row.sourceType] ?? row.sourceType}
      </span>
      <span className="text-[12px] font-medium" style={{ color: S.textPrimary }}>{row.playerName}</span>
      <span className={`text-[12px] font-semibold tabular-nums ${row.coinDelta >= 0 ? "" : ""}`} style={{ color: row.coinDelta >= 0 ? "#3E9E5C" : "#D2694A" }}>
        {row.coinDelta > 0 ? `+${row.coinDelta}` : row.coinDelta} CC
      </span>
      <span className="text-[11px]" style={{ color: S.textSecondary }}>{row.occurredAt.toLocaleDateString("es-CO")}</span>
      {row.ruleVersion ? <span className="text-[10px]" style={{ color: S.textSecondary }}>regla {row.ruleVersion}</span> : null}
      <span className="rounded-[8px] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: STATUS_COLOR[row.status] }}>
        {STATUS_LABEL[row.status] ?? row.status}
      </span>
      <span className="ml-auto text-[10px] tabular-nums" style={{ color: S.textSecondary }}>{row.sourceId.slice(0, 14)}…</span>
    </div>
  );
}

export function CoinsWorkspace({ view }: { view: CoinsWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ clubId: "", playerId: "", coinDelta: "", notes: "" });

  const clubs = [...new Map(view.balances.map((b) => [b.clubId, b.clubName])).entries()]
    .map(([clubId, clubName]) => ({ clubId, clubName }));

  function submitCorrection() {
    const delta = Number(form.coinDelta);
    if (!Number.isInteger(delta) || delta === 0) { setMessage({ kind: "error", text: "Delta debe ser entero distinto de cero." }); return; }
    if (!form.clubId || !form.playerId) { setMessage({ kind: "error", text: "Seleccione jugador y club." }); return; }
    const fd = new FormData();
    fd.set("clubId", form.clubId);
    fd.set("playerId", form.playerId);
    fd.set("coinDelta", String(delta));
    fd.set("notes", form.notes);
    startTransition(async () => {
      try {
        const result: CoinMutationResult = await postCoinCorrectionAction(fd);
        if (result.status === "POSTED") {
          const delta = result.droppedAsDuplicate ? 0 : result.coinDelta;
          setMessage({ kind: "ok", text: result.droppedAsDuplicate ? `Duplicado (ya existía ${delta} CC).` : `Movimiento posteado: ${delta} CC.` });
        } else {
          setMessage({ kind: "ok", text: `${result.status}: ${result.reason}` });
        }
        setForm((prev) => ({ ...prev, coinDelta: "", notes: "" }));
        router.refresh();
      } catch (err) {
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al postear." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · CRACK COINS"
        title="Crack Coins"
        subtitle="Ledger idempotente por idempotencyKey. Sin regla CoinRuleVersion ACTIVE no se emiten monedas (PENDING_RULE)."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Corrección manual (ADMIN)
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club</span>
            <select value={form.clubId} onChange={(e) => setForm((prev) => ({ ...prev, clubId: e.target.value }))} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              <option value="">Seleccione club</option>
              {clubs.map((c) => <option key={c.clubId} value={c.clubId}>{c.clubName}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Jugador</span>
            <input value={form.playerId} onChange={(e) => setForm((prev) => ({ ...prev, playerId: e.target.value }))} placeholder="Id del jugador" className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Delta CC</span>
            <input type="number" value={form.coinDelta} onChange={(e) => setForm((prev) => ({ ...prev, coinDelta: e.target.value }))} placeholder="+80 o -80" className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Nota</span>
            <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Motivo (auditable)" className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
        </div>
        <button type="button" disabled={isPending} onClick={submitCorrection} className="mt-4 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Postear movimiento
        </button>
        {message ? <p className="mt-3 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Balances por jugador
          </h3>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {view.balances.length === 0 ? <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin movimientos posteados.</p> : null}
            {view.balances.map((row) => <BalanceRow key={`${row.clubId}:${row.playerId}`} row={row} />)}
          </div>
        </section>

        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Ledger reciente
          </h3>
          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {view.ledger.length === 0 ? <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin movimientos en el ledger.</p> : null}
            {view.ledger.map((row) => <LedgerRowView key={row.id} row={row} />)}
          </div>
        </section>
      </section>

      <p className="text-[11px]" style={{ color: S.textSecondary }}>
        IDEMPOTENCIA: cada evento PET/Racha duplicado usa la misma idempotencyKey y la clave única del ledger lo descarta sin duplicar monedas. Sin regla ACTIVE, `evaluateCoinMutation` devuelve PENDING_RULE y no crea nada.
      </p>
    </div>
  );
}