"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { recalculateCoachPlayerStreakAction } from "@/app/actions/coach-streak";
import type { StreakWorkspace, StreakPeriodResultView } from "@/lib/streak/service";
import type { StreakComponentPct } from "@/domain/streak/calculate-streak";

const STATUS_COLOR: Record<string, string> = {
  INCOMPLETE: "#D2694A",
  PREVIEW: "#C89B32",
  FINAL: "#7FA65A",
};

const COMPONENT_LABEL: Record<keyof StreakComponentPct, string> = {
  attendance: "Asistencia",
  neurocracks: "NeuroCracks",
  challenge: "Retos",
  pet: "PET",
  validation: "Validaciones",
};

function toDateInput(date: Date): string { return date.toISOString().slice(0, 10); }
function currentWeek(): { start: string; end: string } {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateInput(start), end: toDateInput(end) };
}

export function RachaWorkspace({ workspace }: { workspace: StreakWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clubId, setClubId] = useState(workspace.scopes[0]?.clubId ?? "");
  const [playerId, setPlayerId] = useState(workspace.scopes[0]?.players[0]?.id ?? "");
  const week = currentWeek();
  const [periodStart, setPeriodStart] = useState(week.start);
  const [periodEnd, setPeriodEnd] = useState(week.end);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const club = workspace.scopes.find((item) => item.clubId === clubId);
  const players = club?.players ?? [];
  const player = players.find((item) => item.id === playerId);
  const latest = player?.latest ?? null;

  function recalc() {
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("playerId", playerId);
    formData.set("periodStart", periodStart);
    formData.set("periodEnd", periodEnd);
    startTransition(async () => {
      try {
        const result = await recalculateCoachPlayerStreakAction(formData) as StreakPeriodResultView;
        const statusText = result.calculationStatus === "FINAL"
          ? `Racha FINAL ${result.score} / 100.`
          : result.calculationStatus === "PREVIEW"
            ? `Racha PREVIEW ${result.score ?? "—"} / 100.`
            : "Período INCOMPLETE (sin override no se fabrica un FINAL).";
        notify("ok", statusText);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error inesperado.");
      }
    });
  }

  function notify(kind: "ok" | "error", text: string) { setMessage({ kind, text }); }

  if (workspace.scopes.length === 0) {
    return (
      <div className="flex flex-col gap-6 pt-12">
        <GlobalHero eyebrow="COACH · RACHA" title="Racha" subtitle="Constancia verificable del equipo." />
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-6">
          <p className="text-[13px]" style={{ color: S.textSecondary }}>No tienes equipos asignados como entrenador.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · RACHA"
        title="Racha"
        subtitle="La racha mide constancia verificable: asistencia, NeuroCracks y más. Sin reglas ACTIVE de PET/Validaciones nunca se fabrica un FINAL."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club</span>
            <select value={clubId} onChange={(e) => { setClubId(e.target.value); setPlayerId(workspace.scopes.find((s) => s.clubId === e.target.value)?.players[0]?.id ?? ""); }} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              {workspace.scopes.map((scope) => <option key={scope.clubId} value={scope.clubId}>{scope.clubName}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Jugador</span>
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              {players.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-4">
          <button type="button" disabled={isPending} onClick={recalc} className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Recalcular racha del período
          </button>
          {latest ? <ResultBadge result={latest} /> : null}
        </div>

        {latest ? (
          <div className="mt-5 rounded-[10px] border border-white/[0.06] bg-black/30 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Último resultado · {toDateInput(latest.periodStart)} → {toDateInput(latest.periodEnd)} · regla {latest.ruleVersion}
              </h4>
              <span className="text-[13px] font-bold" style={{ color: STATUS_COLOR[latest.calculationStatus] }}>
                {latest.score !== null ? `${latest.score} / 100` : latest.calculationStatus}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {(Object.keys(COMPONENT_LABEL) as (keyof typeof COMPONENT_LABEL)[]).map((key) => {
                const value = latest.components[key];
                return (
                  <div key={key} className="rounded-[8px] border border-white/[0.05] bg-black/20 px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>{COMPONENT_LABEL[key]}</span>
                    <span className="text-[13px] font-bold" style={{ color: value !== null ? S.textPrimary : "#686862" }}>
                      {value !== null ? `${value} / 100` : "PENDIENTE"}
                    </span>
                  </div>
                );
              })}
            </div>
            {latest.reason ? <p className="mt-3 text-[12px]" style={{ color: S.textSecondary }}>{latest.reason}</p> : null}
            {latest.verifiedWeek !== null ? <p className="mt-2 text-[12px]" style={{ color: latest.verifiedWeek ? "#7FA65A" : "#D2694A" }}>Verified Week: {latest.verifiedWeek ? "CUMPLIDA" : "NO"}</p> : null}
          </div>
        ) : (
          <p className="mt-4 text-[12px]" style={{ color: S.textSecondary }}>Sin períodos calculados para este jugador todavía. Recálcula para generar el primer resultado.</p>
        )}

        {message ? <p className="mt-3 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}
      </section>
    </div>
  );
}

function ResultBadge({ result }: { result: StreakPeriodResultView }) {
  return (
    <span className="rounded-[8px] border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: STATUS_COLOR[result.calculationStatus] }}>
      {result.calculationStatus} · {result.score !== null ? `${result.score}` : "—"} / 100
    </span>
  );
}