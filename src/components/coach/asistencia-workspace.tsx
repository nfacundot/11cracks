"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import {
  saveAttendanceSessionAction,
  saveAttendanceSessionByIdAction,
} from "@/app/actions/coach-attendance";
import type { AttendanceWorkspace } from "@/lib/attendance/service";
import { ATTENDANCE_LABEL, sessionDateOf, sessionLabelOf } from "@/domain/attendance/attendance-contract";
import type { AttendanceStatus } from "@/domain/attendance/attendance-contract";

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "PENDING"];
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  PRESENT: "#7FA65A",
  ABSENT: "#D2694A",
  PENDING: "#AAA69C",
};

function todayIso(): string { return new Date().toISOString().slice(0, 10); }

export function AsistenciaWorkspace({ workspace }: { workspace: AttendanceWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clubId, setClubId] = useState(workspace.scopes[0]?.clubId ?? "");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [date, setDate] = useState(todayIso());
  const [label, setLabel] = useState("");
  const [selectedSession, setSelectedSession] = useState(workspace.sessions[0]?.sessionId ?? "");
  const [statusByPlayer, setStatusByPlayer] = useState<Record<string, AttendanceStatus>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const club = workspace.scopes.find((item) => item.clubId === clubId);
  const players = club?.players ?? [];

  const existingModeSession = workspace.sessions.find((item) => item.sessionId === selectedSession);
  const recordsByPlayer = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const record of workspace.records) {
      if (record.sessionId === selectedSession && record.status !== "PENDING") {
        map[record.playerId] = record.status;
      }
    }
    return map;
  }, [workspace.records, selectedSession]);

  function openSession(sessionId: string) {
    setMode("existing");
    setSelectedSession(sessionId);
    const initial: Record<string, AttendanceStatus> = {};
    for (const record of workspace.records) {
      if (record.sessionId === sessionId && record.status !== "PENDING") {
        initial[record.playerId] = record.status;
      }
    }
    setStatusByPlayer(initial);
  }

  function openNew() {
    setMode("new");
    setDate(todayIso());
    setLabel("");
    setStatusByPlayer({});
  }

  function submit() {
    const entries = players
      .filter((player) => statusByPlayer[player.id])
      .map((player) => ({ playerId: player.id, status: statusByPlayer[player.id] }));
    if (entries.length === 0) {
      notify("error", "Define al menos un estado antes de guardar.");
      return;
    }
    const formData = new FormData();
    formData.set("clubId", clubId);
    formData.set("entries", JSON.stringify(entries));
    if (mode === "existing") {
      if (!selectedSession) { notify("error", "Selecciona una sesión."); return; }
      formData.set("sessionId", selectedSession);
    } else {
      formData.set("date", date);
      formData.set("label", label);
    }
    startTransition(async () => {
      try {
        const result = await (mode === "existing"
          ? saveAttendanceSessionByIdAction(formData)
          : saveAttendanceSessionAction(formData)) as { saved: number };
        notify("ok", `Asistencia guardada: ${result.saved} jugadores.`);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Error inesperado.");
      }
    });
  }

  function notify(kind: "ok" | "error", text: string) { setMessage({ kind, text }); }

  const presentCount = players.filter((p) => statusByPlayer[p.id] === "PRESENT").length;
  const absentCount = players.filter((p) => statusByPlayer[p.id] === "ABSENT").length;
  const pendingCount = players.filter((p) => !statusByPlayer[p.id] || statusByPlayer[p.id] === "PENDING").length;

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · ASISTENCIA"
        title="Entrenamientos"
        subtitle="Marca por jugador: Asistió / Ausente / Pendiente. Pendiente nunca se convierte en ausencia."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex flex-col gap-1.5 md:min-w-[220px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Club</span>
            <select value={clubId} onChange={(e) => { setClubId(e.target.value); setStatusByPlayer({}); }} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
              {workspace.scopes.map((scope) => <option key={scope.clubId} value={scope.clubId}>{scope.clubName}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={openNew} className={`rounded-[10px] border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${mode === "new" ? "border-[#C9A24A]/70 bg-[#C9A24A]/15" : "border-white/10 hover:border-white/25"}`} style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Nueva sesión
            </button>
            {workspace.sessions.length > 0 ? (
              <button type="button" onClick={() => { setMode("existing"); setSelectedSession(workspace.sessions[0].sessionId); openSession(workspace.sessions[0].sessionId); }} className={`rounded-[10px] border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${mode === "existing" ? "border-[#C9A24A]/70 bg-[#C9A24A]/15" : "border-white/10 hover:border-white/25"}`} style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Sesiones anteriores
              </button>
            ) : null}
          </div>
          {mode === "new" ? (
            <label className="flex flex-col gap-1.5 md:min-w-[240px]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Nombre de la sesión</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Técnica individual" className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
            </label>
          ) : (
            <label className="flex flex-col gap-1.5 md:min-w-[220px]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Sesión</span>
              <select value={selectedSession} onChange={(e) => openSession(e.target.value)} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }}>
                {workspace.sessions.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {sessionDateOf(session.sessionId)} · {sessionLabelOf(session.sessionId)} · {session.recordCount} registros
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === "new" ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>Fecha</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-[10px] border border-white/10 bg-black/40 px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/60" style={{ color: S.textPrimary }} />
            </label>
          ) : null}
        </div>
      </section>

      {mode === "existing" && existingModeSession ? (
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            {sessionDateOf(existingModeSession.sessionId)} · {sessionLabelOf(existingModeSession.sessionId)}
          </h3>
        </section>
      ) : null}

      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Jugadores · {club?.clubName ?? "Sin club"}
          </h3>
          <div className="flex gap-4 text-[11px]" style={{ fontFamily: S.barlow }}>
            <span style={{ color: STATUS_COLOR.PRESENT }}>{presentCount} Asistieron</span>
            <span style={{ color: STATUS_COLOR.ABSENT }}>{absentCount} Ausentes</span>
            <span style={{ color: STATUS_COLOR.PENDING }}>{pendingCount} Pendientes</span>
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {players.length === 0 ? (
            <p className="text-[13px]" style={{ color: S.textSecondary }}>Sin jugadores en este club.</p>
          ) : (
            players.map((player) => {
              const effective = statusByPlayer[player.id] ?? recordsByPlayer[player.id] ?? "PENDING";
              return (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate" style={{ color: S.textPrimary }}>{player.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusByPlayer((prev) => ({ ...prev, [player.id]: status }))}
                        className={`rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold transition ${effective === status ? "border-[#C9A24A]/70 bg-[#C9A24A]/15" : "border-white/10 hover:border-white/25"}`}
                        style={{ color: effective === status ? S.textPrimary : S.textSecondary }}
                      >
                        {ATTENDANCE_LABEL[status]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {message ? <p className="mt-4 text-[12px]" style={{ color: message.kind === "ok" ? "#7FA65A" : "#D2694A" }}>{message.text}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-4">
          <button type="button" disabled={isPending || players.length === 0} onClick={submit} className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Guardar asistencia de la sesión
          </button>
          <span className="text-[11px]" style={{ color: S.textSecondary }}>
            PENDING queda fuera del conteo de ausencias y no genera racha.
          </span>
        </div>
      </section>
    </div>
  );
}