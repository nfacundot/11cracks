"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import {
  createCoachEvaluationAction,
  publishCoachEvaluationAction,
  createCorrectiveEvaluationAction,
} from "@/app/actions/coach-evaluations";
import type { EvaluationsWorkspace } from "@/lib/evaluations/service";
import type { RubricLevel } from "@/domain/evaluations/rubric";
import { RUBRIC_LEVELS } from "@/domain/evaluations/rubric";

const RUBRIC_LABEL: Record<RubricLevel, string> = {
  NOT_OBSERVED: "No observado",
  NEEDS_SUPPORT: "Requiere apoyo",
  IN_DEVELOPMENT: "En desarrollo",
  ADEQUATE: "Adecuado",
  OUTSTANDING: "Sobresaliente",
  CONSOLIDATED: "Consolidado",
};

const RUBRIC_VALUE: Record<RubricLevel, string> = {
  NOT_OBSERVED: "—",
  NEEDS_SUPPORT: "20",
  IN_DEVELOPMENT: "40",
  ADEQUATE: "60",
  OUTSTANDING: "80",
  CONSOLIDATED: "100",
};

const STATUS_LABEL = { DRAFT: "Borrador", PUBLISHED: "Publicada", CORRECTED: "Corregida", CANCELLED: "Cancelada" } as const;

function toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
function defaultStart(): string { const d = new Date(); d.setDate(d.getDate() - 30); return toDateInput(d); }
function defaultEnd(): string { return toDateInput(new Date()); }

export function EvaluacionWorkspace({ workspace }: { workspace: EvaluationsWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clubId, setClubId] = useState(workspace.scopes[0]?.clubId ?? "");
  const [playerId, setPlayerId] = useState(workspace.scopes[0]?.players[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState(defaultStart());
  const [periodEnd, setPeriodEnd] = useState(defaultEnd());
  const [selected, setSelected] = useState<Record<string, RubricLevel>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const club = workspace.scopes.find((item) => item.clubId === clubId);
  const players = club?.players ?? [];
  const sportDimensions = useMemo(() => workspace.dimensions.filter((d) => d.group === "SPORT"), [workspace.dimensions]);
  const neuroDimensions = useMemo(() => workspace.dimensions.filter((d) => d.group === "NEUROCRACKS"), [workspace.dimensions]);
  const myEvaluations = workspace.evaluations.filter((item) => item.clubId === clubId && item.playerId === playerId);
  const latestPublished = myEvaluations.find((item) => item.status === "PUBLISHED");

  function notify(kind: "ok" | "error", text: string) { setMessage({ kind, text }); }
  function run(action: (formData: FormData) => Promise<unknown>, formData: FormData, okText: string) {
    startTransition(async () => {
      try {
        const result = (await action(formData)) as { snapshot?: { elevenScore: number | null; calculationStatus: string } } | null;
        notify("ok", result?.snapshot
          ? `${okText} Snapshot: ${result.snapshot.elevenScore !== null ? `${result.snapshot.elevenScore} / 100` : "INCOMPLETE → faltan fuentes."}`
          : okText);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error inesperado.");
      }
    });
  }

  function submitCreate(supersedesEvaluationId: string | null) {
    const items = Object.entries(selected).map(([dimensionKey, rubricLevel]) => ({ dimensionKey, rubricLevel }));
    if (items.length === 0) { notify("error", "Registra al menos una dimensión observada."); return; }
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("playerId", playerId);
    formData.set("periodStart", periodStart);
    formData.set("periodEnd", periodEnd);
    formData.set("items", JSON.stringify(items));
    if (supersedesEvaluationId) {
      formData.set("supersedesEvaluationId", supersedesEvaluationId);
      run(createCorrectiveEvaluationAction, formData, "Versión correctiva creada como borrador.");
    } else {
      run(createCoachEvaluationAction, formData, "Evaluación guardada como borrador.");
    }
  }

  function submitPublish(evaluationId: string) {
    const formData = new FormData();
    formData.set("evaluationId", evaluationId);
    run(publishCoachEvaluationAction, formData, "Evaluación publicada.");
  }

  function copyLatestPublished() {
    if (!latestPublished) return;
    setSelected(Object.fromEntries(latestPublished.items.map((item) => [item.dimensionKey, item.rubricLevel])));
    setPeriodStart(toDateInput(latestPublished.periodStart));
    setPeriodEnd(toDateInput(latestPublished.periodEnd));
    notify("ok", "Versión correctiva lista. Ajusta lo necesario y publica.");
  }

  if (workspace.scopes.length === 0) {
    return (
      <div className="flex flex-col gap-6 pt-12">
        <GlobalHero eyebrow="COACH · OBSERVACIÓN" title="Evaluar" subtitle="Registra lo que observaste en cancha." />
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-6">
          <p className="text-[13px]" style={{ color: S.textSecondary }}>No tienes equipos asignados como entrenador en este club.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · OBSERVACIÓN"
        title="Evaluar"
        subtitle="Selecciona el jugador y registra lo observado con la rúbrica. Publicar recalcula el snapshot con la fórmula activa."
      />

      <form ref={formRef} className="flex flex-col gap-5 rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club</span>
            <select value={clubId} onChange={(e) => { setClubId(e.target.value); setPlayerId(workspace.scopes.find((s) => s.clubId === e.target.value)?.players[0]?.id ?? ""); setSelected({}); }} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              {workspace.scopes.map((scope) => <option key={scope.clubId} value={scope.clubId}>{scope.clubName}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Jugador</span>
            <select value={playerId} onChange={(e) => { setPlayerId(e.target.value); setSelected({}); }} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Periodo desde</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Periodo hasta</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <RubricPanel
            title={`Deporte · ${players.find((p) => p.id === playerId)?.name ?? "Jugador"}`}
            dimensions={sportDimensions}
            selected={selected}
            onSelect={(key, level) => setSelected((prev) => ({ ...prev, [key]: level }))}
          />
          <RubricPanel
            title={`NeuroCracks · ${players.find((p) => p.id === playerId)?.name ?? "Jugador"}`}
            dimensions={neuroDimensions}
            selected={selected}
            onSelect={(key, level) => setSelected((prev) => ({ ...prev, [key]: level }))}
          />
        </div>

        {message ? <p className="text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={isPending} onClick={() => submitCreate(latestPublished ? latestPublished.id : null)} className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            {latestPublished ? "Crear versión correctiva" : "Guardar borrador"}
          </button>
          {latestPublished ? (
            <button type="button" onClick={copyLatestPublished} className="rounded-[10px] border border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/25" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Copiar última publicada
            </button>
          ) : null}
          <span className="text-[11px]" style={{ color: S.textSecondary }}>
            {Object.keys(selected).length} / {workspace.dimensions.length} dimensiones con respuesta
          </span>
        </div>
      </form>

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Evaluaciones de {players.find((p) => p.id === playerId)?.name ?? "Jugador"}
        </h3>
        <div className="mt-4 space-y-3">
          {myEvaluations.length === 0 ? (
            <p className="text-[13px]" style={{ color: S.textSecondary }}>Sin evaluaciones registradas todavía.</p>
          ) : (
            myEvaluations.map((evaluation) => (
              <article key={evaluation.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-white/[0.06] bg-black/30 px-4 py-3">
                <b className="text-[12px]" style={{ color: S.textPrimary }}>{STATUS_LABEL[evaluation.status]}</b>
                <span className="text-[12px]" style={{ color: S.textSecondary }}>
                  {toDateInput(evaluation.periodStart)} → {toDateInput(evaluation.periodEnd)}
                </span>
                <span className="text-[12px]" style={{ color: S.textSecondary }}>{evaluation.items.length}/{workspace.dimensions.length} dims</span>
                {evaluation.supersedesEvaluationId ? (
                  <span className="text-[11px]" style={{ color: "#C89B32" }}>Supercede a {evaluation.supersedesEvaluationId.slice(0, 8)}</span>
                ) : null}
                {evaluation.publishedAt ? <span className="text-[11px]" style={{ color: S.textSecondary }}>Publicada {toDateInput(evaluation.publishedAt)}</span> : null}
                <span className="text-[11px] font-mono opacity-60" style={{ color: S.textSecondary }}>{evaluation.id.slice(0, 8)}</span>
                {evaluation.status === "DRAFT" ? (
                  <button type="button" disabled={isPending} onClick={() => submitPublish(evaluation.id)} className="ml-auto rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                    Publicar
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function RubricPanel({ title, dimensions, selected, onSelect }: {
  title: string;
  dimensions: { key: string; label: string; description: string | null }[];
  selected: Record<string, RubricLevel>;
  onSelect: (key: string, level: RubricLevel) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
        {title}
      </h3>
      <div className="mt-4 space-y-5">
        {dimensions.map((dimension) => (
          <div key={dimension.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>{dimension.label}</span>
              {dimension.description ? <span className="hidden shrink-0 text-[11px] leading-tight sm:block" style={{ color: S.textSecondary }}>{dimension.description}</span> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RUBRIC_LEVELS.map((level) => {
                const active = selected[dimension.key] === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSelect(dimension.key, level)}
                    className={`rounded-[8px] border px-2.5 py-1.5 text-[11px] transition ${active ? "border-[#C9A24A]/70 bg-[#C9A24A]/15" : "border-white/10 bg-black/30 hover:border-white/25"}`}
                    style={{ color: active ? "var(--text-primary)" : S.textSecondary }}
                  >
                    {RUBRIC_LABEL[level]}<em className="ml-1 not-italic opacity-70">{RUBRIC_VALUE[level]}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}