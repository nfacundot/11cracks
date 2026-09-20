"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { requestCoinCorrectionAction, reviewCorrectionAction, applyCorrectionAction } from "@/app/actions/corrections";
import type { DataCorrectionRow } from "@/lib/corrections/service";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  APPLIED: "Aplicada",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#C89B32",
  APPROVED: "#4A90B8",
  REJECTED: "#D2694A",
  APPLIED: "#3E9E5C",
};

export function CorrectionsWorkspace({ view }: { view: { corrections: DataCorrectionRow[] } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ entityId: "", coinDelta: "", reason: "" });

  function run(action: (formData: FormData) => Promise<unknown>, formData: FormData, okText: string) {
    startTransition(async () => {
      try {
        await action(formData);
        setMessage({ kind: "ok", text: okText });
        router.refresh();
      } catch (err) {
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error inesperado." });
      }
    });
  }

  function request() {
    const delta = Number(form.coinDelta);
    if (!Number.isInteger(delta)) { setMessage({ kind: "error", text: "Delta solicitado debe ser entero." }); return; }
    if (!form.entityId.trim()) { setMessage({ kind: "error", text: "Id del movimiento es obligatorio." }); return; }
    if (!form.reason.trim()) { setMessage({ kind: "error", text: "El motivo es obligatorio." }); return; }
    const fd = new FormData();
    fd.set("entityId", form.entityId.trim());
    fd.set("coinDelta", String(delta));
    fd.set("reason", form.reason.trim());
    run(requestCoinCorrectionAction, fd, "Solicitud de corrección creada.");
    setForm((prev) => ({ ...prev, coinDelta: "", reason: "" }));
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · CORRECCIONES"
        title="Correcciones"
        subtitle="Nunca se borra o reemplaza silenciosamente: reverso (−coinDelta, reversalOf) + reemplazo (+nuevo delta), todos apuntan a la misma corrección. Policy: solo coin_ledger por ahora."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Solicitar corrección de movimiento (ADMIN)
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Id del movimiento (ledger)</span>
            <input value={form.entityId} onChange={(e) => setForm((prev) => ({ ...prev, entityId: e.target.value }))} placeholder="id de CrackCoinLedger POSTED" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Nuevo delta CC</span>
            <input type="number" value={form.coinDelta} onChange={(e) => setForm((prev) => ({ ...prev, coinDelta: e.target.value }))} placeholder="+80" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Motivo</span>
            <input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Corrección inicial" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
        </div>
        <button type="button" disabled={isPending} onClick={request} className="mt-4 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Solicitar corrección
        </button>
        {message ? <p className="mt-3 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Solicitudes
        </h3>
        <div className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {view.corrections.length === 0 ? <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin solicitudes.</p> : null}
          {view.corrections.map((correction) => (
            <article key={correction.id} className="rounded-[10px] border border-white/[0.05] bg-black/25 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-[8px] border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: STATUS_COLOR[correction.status] }}>
                  {STATUS_LABEL[correction.status] ?? correction.status}
                </span>
                <b className="text-[13px]" style={{ color: S.textPrimary }}>{correction.entityType} · {correction.entityId.slice(0, 10)}…</b>
                <span className="text-[11px]" style={{ color: S.textSecondary }}>{correction.requestedBy.slice(0, 8)}…</span>
                <span className="ml-auto text-[11px]" style={{ color: S.textSecondary }}>{correction.requestedAt.toLocaleString("es-CO")}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px]">
                <span className="text-[11px]" style={{ color: S.textSecondary }}>Antes: {JSON.stringify(correction.originalValue)}</span>
                <span className="text-[11px]" style={{ color: S.textPrimary }}>Solicitado: {JSON.stringify(correction.requestedValue)}</span>
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: S.textSecondary }}>Motivo: {correction.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {correction.status === "PENDING" ? (
                  <button type="button" disabled={isPending} onClick={() => { const fd = new FormData(); fd.set("correctionId", correction.id); fd.set("approve", "1"); run(reviewCorrectionAction, fd, "Corrección aprobada."); }} className="rounded-[8px] border border-[#4A90B8]/40 bg-[#4A90B8]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-[#4A90B8]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: "#4A90B8" }}>
                    Aprobar
                  </button>
                ) : null}
                {correction.status === "PENDING" ? (
                  <button type="button" disabled={isPending} onClick={() => { const fd = new FormData(); fd.set("correctionId", correction.id); fd.set("approve", "0"); run(reviewCorrectionAction, fd, "Corrección rechazada."); }} className="rounded-[8px] border border-[#D2694A]/40 bg-[#D2694A]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-[#D2694A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: "#D2694A" }}>
                    Rechazar
                  </button>
                ) : null}
                {correction.status === "APPROVED" ? (
                  <button type="button" disabled={isPending} onClick={() => { const fd = new FormData(); fd.set("correctionId", correction.id); run(applyCorrectionAction, fd, "Corrección aplicada: reverso + reemplazo."); }} className="rounded-[8px] border border-[#3E9E5C]/40 bg-[#3E9E5C]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-[#3E9E5C]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: "#3E9E5C" }}>
                    Aplicar (reverso + reemplazo)
                  </button>
                ) : null}
                {correction.appliedAt ? <span className="self-center text-[11px]" style={{ color: S.textSecondary }}>aplicado {correction.appliedAt.toLocaleString("es-CO")}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}