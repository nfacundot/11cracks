"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import {
  cancelPetBatchAction,
  createPetBatchAction,
  createPetContributionAction,
  dispatchPetBatchAction,
  reconcilePetBatchAction,
  settlePetBatchAction,
  weighPetBatchAction,
} from "@/app/actions/pet";
import type { PetWorkspaceClub, PetBatchRow } from "@/lib/pet/service";
import type { PetBatchState } from "@/domain/pet/pet-invariants";

const STATUS_COLOR: Record<PetBatchState, string> = {
  DRAFT: "#AAA69C",
  SENT: "#C89B32",
  WEIGHED: "#7FA65A",
  SETTLED: "#4A90B8",
  RECONCILED: "#3E9E5C",
  CANCELLED: "#D2694A",
};

const STATUS_LABEL: Record<PetBatchState, string> = {
  DRAFT: "Borrador",
  SENT: "Despachado",
  WEIGHED: "Pesado",
  SETTLED: "Liquidado",
  RECONCILED: "Conciliado",
  CANCELLED: "Cancelado",
};

const CONTRIBUTION_LABEL: Record<string, string> = {
  COLLECTED: "Recolectada",
  PENDING_DISPATCH: "Pendiente de despacho",
  IN_BATCH: "En lote",
  CANCELLED: "Cancelada",
};

interface ActionFormProps {
  batch: PetBatchRow;
  clubId: string;
  fields: { key: string; label: string; required?: boolean }[];
  submitLabel: string;
  action: (formData: FormData) => Promise<unknown>;
  confirmText?: string;
}

function ActionForm({ batch, clubId, fields, submitLabel, action, confirmText }: ActionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const id = batch.id.slice(0, 8);

  function submit() {
    if (confirmText && !window.confirm(confirmText)) return;
    const formData = new FormData();
    formData.set("batchId", batch.id);
    formData.set("clubId", clubId);
    for (const field of fields) {
      const element = document.getElementById(`pet-${id}-${field.key}`) as HTMLInputElement | null;
      if (!element) {
        setError(`Campo ${field.label} no encontrado.`);
        return;
      }
      if (field.required && !element.value.trim()) {
        setError(`${field.label} es obligatorio.`);
        return;
      }
      formData.set(field.key, element.value);
    }
    startTransition(async () => {
      try {
        await action(formData);
        setError(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {fields.map((f) => {
        const inputId = `pet-${id}-${f.key}`;
        const numeric = f.key === "realKg" || f.key === "bottlesSent" || f.key === "copPaid";
        const date = f.key === "dispatchDate" || f.key === "receivedAt";
        return (
          <label key={inputId} className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>{f.label}{f.required ? " *" : ""}</span>
            <input
              id={inputId}
              type={date ? "date" : numeric ? "number" : "text"}
              min={numeric ? 0 : undefined}
              step={numeric && f.key !== "bottlesSent" && f.key !== "copPaid" ? "0.001" : undefined}
              className={`rounded-[8px] border border-white/10 tk-control px-3 py-2 text-[12px] outline-none focus:border-[#C9A24A]/60 ${date ? "" : "w-48"}`}
              style={{ color: S.textPrimary }}
            />
          </label>
        );
      })}
      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="rounded-[8px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40"
        style={{ fontFamily: S.barlow, color: S.textPrimary }}
      >
        {submitLabel}
      </button>
      {error ? <span className="text-[11px]" style={{ color: "#D2694A" }}>{error}</span> : null}
    </div>
  );
}

export function PetWorkspace({ view }: { view: PetWorkspaceClub[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clubId, setClubId] = useState(view[0]?.clubId ?? "");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [selectedContributions, setSelectedContributions] = useState<string[]>([]);
  const [batchCode, setBatchCode] = useState("");
  const [contributionForm, setContributionForm] = useState({ playerId: "", bottles: 0, estimatedKg: "" });

  const club = view.find((item) => item.clubId === clubId);
  const collectable = (club?.contributions ?? []).filter((contribution) => contribution.status === "COLLECTED");

  function notify(kind: "ok" | "error", text: string) { setMessage({ kind, text }); }
  function run(action: (formData: FormData) => Promise<unknown>, formData: FormData, okText: string) {
    startTransition(async () => {
      try {
        await action(formData);
        notify("ok", okText);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error inesperado.");
      }
    });
  }

  function submitContribution() {
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("playerId", contributionForm.playerId);
    formData.set("recordedAt", new Date().toISOString().slice(0, 10));
    formData.set("bottlesCount", String(contributionForm.bottles));
    formData.set("estimatedKg", contributionForm.estimatedKg);
    run(createPetContributionAction, formData, "Recolección registrada.");
    setContributionForm((prev) => ({ ...prev, bottles: 0, estimatedKg: "" }));
  }

  function submitCreateBatch() {
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("batchCode", batchCode);
    formData.set("contributionIds", JSON.stringify(selectedContributions));
    run(createPetBatchAction, formData, "Lote creado en DRAFT.");
    setSelectedContributions([]);
    setBatchCode("");
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · PET"
        title="PET"
        subtitle="Recolección → Lote → Pesaje real → Liquidación → Conciliación. El estimado nunca se convierte en dinero real."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <label className="flex flex-col gap-1.5 md:max-w-[260px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club</span>
          <select value={clubId} onChange={(e) => { setClubId(e.target.value); setSelectedContributions([]); }} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
            {view.map((item) => <option key={item.clubId} value={item.clubId}>{item.clubName}</option>)}
          </select>
        </label>
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Registrar recolección · {club?.clubName ?? "Sin club"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Jugador</span>
            <select value={contributionForm.playerId} onChange={(e) => setContributionForm((prev) => ({ ...prev, playerId: e.target.value }))} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              <option value="">Sin jugador asignado</option>
              {(club?.players ?? []).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Botellas</span>
            <input type="number" min={0} value={contributionForm.bottles || ""} onChange={(e) => setContributionForm((prev) => ({ ...prev, bottles: e.target.valueAsNumber }))} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Fecha</span>
            <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Kg estimados (opcional)</span>
            <input type="number" min={0} step="0.001" value={contributionForm.estimatedKg} onChange={(e) => setContributionForm((prev) => ({ ...prev, estimatedKg: e.target.value }))} placeholder="Solo visible, no genera COP" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
        </div>
        <button type="button" disabled={isPending} onClick={submitContribution} className="mt-5 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Registrar recolección
        </button>
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Crear lote (DRAFT)
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Código único de lote</span>
            <input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="LOTE-001" className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <div className="flex items-end">
            <button type="button" disabled={isPending || selectedContributions.length === 0 || !batchCode.trim()} onClick={submitCreateBatch} className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Crear lote ({selectedContributions.length})
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {collectable.length === 0 ? (
            <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin recolecciones disponibles (COLLECTED). Registra recolecciones primero.</p>
          ) : (
            collectable.map((contribution) => (
              <label key={contribution.id} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-4 py-2.5">
                <input type="checkbox" checked={selectedContributions.includes(contribution.id)} onChange={(e) => setSelectedContributions((prev) => e.target.checked ? [...prev, contribution.id] : prev.filter((id) => id !== contribution.id))} className="accent-[#C9A24A]" />
                <span className="text-[12px]" style={{ color: S.textPrimary }}>{contribution.playerName ?? "Sin jugador"} · {contribution.bottlesCount} botellas</span>
                <span className="ml-auto text-[11px]" style={{ color: S.textSecondary }}>{contribution.estimatedKg !== null ? `${contribution.estimatedKg} kg est` : "sin estimado"}</span>
              </label>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Lotes · {club?.clubName ?? "Sin club"}
        </h3>
        <div className="mt-4 space-y-3">
          {(club?.batches ?? []).length === 0 ? (
            <p className="text-[12px]" style={{ color: S.textSecondary }}>Sin lotes todavía.</p>
          ) : (
            (club?.batches ?? []).map((batch) => (
              <article key={batch.id} className="rounded-[10px] border border-white/[0.05] bg-black/25 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <b className="text-[13px]" style={{ color: S.textPrimary }}>{batch.batchCode}</b>
                  <span className="rounded-[8px] border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: STATUS_COLOR[batch.status] }}>
                    {STATUS_LABEL[batch.status]}
                  </span>
                  <span className="text-[11px]" style={{ color: S.textSecondary }}>{batch.contributionCount} aportes</span>
                  {batch.bottlesSent !== null ? <span className="text-[11px]" style={{ color: S.textSecondary }}>{batch.bottlesSent} botellas despachadas</span> : null}
                  {batch.realKg !== null ? <span className="text-[11px]" style={{ color: S.textSecondary }}>{batch.realKg} kg reales</span> : null}
                  {batch.copPaid !== null ? <span className="text-[11px]" style={{ color: S.textPrimary }}>${batch.copPaid.toLocaleString("es-CO")} COP</span> : null}
                  {batch.pricePerKg !== null ? <span className="text-[11px]" style={{ color: "#C89B32" }}>${batch.pricePerKg.toLocaleString("es-CO")}/kg</span> : null}
                  {batch.paymentReference ? <span className="text-[11px]" style={{ color: S.textSecondary }}>ref {batch.paymentReference}</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {batch.status === "DRAFT" ? <ActionForm batch={batch} clubId={clubId} fields={[{ key: "dispatchDate", label: "Fecha de despacho", required: true }, { key: "bottlesSent", label: "Botellas", required: true }, { key: "processorName", label: "Compactadora" }]} submitLabel="Despachar → SENT" action={dispatchPetBatchAction} /> : null}
                  {batch.status === "SENT" ? <ActionForm batch={batch} clubId={clubId} fields={[{ key: "receivedAt", label: "Fecha recepción", required: true }, { key: "realKg", label: "Kg reales", required: true }, { key: "processorName", label: "Compactadora", required: true }, { key: "weighingDocumentUrl", label: "Doc. pesaje", required: true }]} submitLabel="Pesar → WEIGHED" action={weighPetBatchAction} /> : null}
                  {batch.status === "WEIGHED" ? <ActionForm batch={batch} clubId={clubId} fields={[{ key: "copPaid", label: "COP pagados", required: true }, { key: "settlementDocumentUrl", label: "Soporte liquidación", required: true }]} submitLabel="Liquidar → SETTLED" action={settlePetBatchAction} /> : null}
                  {batch.status === "SETTLED" ? <ActionForm batch={batch} clubId={clubId} fields={[{ key: "paymentReference", label: "Referencia de pago", required: true }]} submitLabel="Conciliar → RECONCILED" action={reconcilePetBatchAction} /> : null}
                  {batch.status === "RECONCILED" ? <span className="text-[11px]" style={{ color: "#3E9E5C" }}>Conciliado: se corrige solo con bitácora ({batch.reconciledBy ?? "—"} · {batch.reconciledAt ? new Date(batch.reconciledAt).toLocaleDateString("es-CO") : "—"})</span> : null}
                  {batch.status !== "RECONCILED" && batch.status !== "CANCELLED" ? <ActionForm batch={batch} clubId={clubId} fields={[]} submitLabel="Cancelar" action={cancelPetBatchAction} confirmText="¿Cancelar el lote? Los aportes vuelven a COLLECTED." /> : null}
                </div>
              </article>
            ))
          )}
        </div>
        {message ? <p className="mt-4 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}
      </section>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Aportes recientes
        </h3>
        <div className="mt-4 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {(club?.contributions ?? []).slice(0, 60).map((contribution) => (
            <div key={contribution.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-white/[0.04] bg-white/[0.02] px-4 py-2">
              <span className="text-[12px] font-medium" style={{ color: S.textPrimary }}>{contribution.playerName ?? "Sin jugador"}</span>
              <span className="text-[12px]" style={{ color: S.textSecondary }}>{new Date(contribution.recordedAt).toLocaleDateString("es-CO")}</span>
              <span className="text-[12px]" style={{ color: S.textPrimary }}>{contribution.bottlesCount} botellas</span>
              {contribution.estimatedKg !== null ? <span className="text-[11px]" style={{ color: S.textSecondary }}>{contribution.estimatedKg} kg est</span> : null}
              <span className="ml-auto rounded-[8px] border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                {CONTRIBUTION_LABEL[contribution.status] ?? contribution.status}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px]" style={{ color: S.textSecondary }}>Firewall: los kg estimados son solo de planeación. Solo el pesaje documentado de la compactadora alimenta la liquidación (pricePerKg = COP / kg reales).</p>
      </section>
    </div>
  );
}