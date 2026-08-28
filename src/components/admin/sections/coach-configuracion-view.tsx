"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { Modal } from "@/components/admin/modal";
import { saveTeamConfiguration, updateMemberPosition, type TeamState } from "@/actions/team";

export type CoachTeamData = {
  id: string | null;
  name: string;
  code: string | null;
  logoUrl: string | null;
  memberIds: string[];
  members: PlayerOption[];
};

export type PlayerOption = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  position: string | null;
  lineupPosition?: string | null;
};

const POSITIONS = [
  { code: "POR", label: "Portero" },
  { code: "LD", label: "Lateral Derecho" },
  { code: "DFC", label: "Central" },
  { code: "LI", label: "Lateral Izquierdo" },
  { code: "MCD", label: "Pivote" },
  { code: "MC", label: "Mediocampista" },
  { code: "MCO", label: "Mediapunta" },
  { code: "ED", label: "Extremo Derecho" },
  { code: "EI", label: "Extremo Izquierdo" },
  { code: "DC", label: "Delantero Centro" },
  { code: "SD", label: "Segundo Delantero" },
];

const MAX_POSITIONS = POSITIONS.length;

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalize(value: string): string {
  return value.replace(/^@+/, "").trim().toLowerCase();
}

export function CoachConfiguracionView({
  team,
  players,
}: {
  team: CoachTeamData;
  players: PlayerOption[];
}) {
  const [state, formAction, pending] = useActionState<TeamState, FormData>(
    saveTeamConfiguration,
    undefined,
  );
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(team.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(team.memberIds));
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const member of team.members) {
      if (member.lineupPosition) initial[member.id] = member.lineupPosition;
    }
    return initial;
  });
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [savingPosId, setSavingPosId] = useState<string | null>(null);
  const [ficha, setFicha] = useState<PlayerOption | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string, kind: "ok" | "err") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const selectedPlayers = players.filter((p) => selected.has(p.id));

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return players
      .filter(
        (p) =>
          !selected.has(p.id) &&
          (p.name.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            (p.position ?? "").toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, players, selected]);

  const selectPlayer = (id: string) => {
    setSelected((prev) => {
      if (prev.has(id)) return prev;
      if (prev.size >= MAX_POSITIONS) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Pre-asignar la posición guardada/natural del jugador si aún está libre
    const player = players.find((p) => p.id === id);
    const natural = player?.position ?? "";
    if (natural && !Object.values(assignments).includes(natural)) {
      setAssignments((prev) => ({ ...prev, [id]: natural }));
    }
    setQuery("");
  };

  const removePlayer = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const assignPosition = (id: string, pos: string) => {
    setAssignments((prev) => {
      if (pos && Object.entries(prev).some(([uid, code]) => uid !== id && code === pos)) {
        return prev;
      }
      return { ...prev, [id]: pos };
    });
  };

  // Cambio de posición: check automático + guardado inmediato en BD + toast
  const changePosition = async (player: PlayerOption, pos: string) => {
    const previous = assignments[player.id] ?? "";
    if (previous === pos) return;

    assignPosition(player.id, pos);

    if (!team.id) {
      showToast("El equipo aún no existe: usa Guardar configuración", "err");
      setAssignments((prev) => ({ ...prev, [player.id]: previous }));
      return;
    }

    setSavingPosId(player.id);
    try {
      const res = await updateMemberPosition(team.id, player.id, pos);
      if (res.error) {
        assignPosition(player.id, previous);
        showToast(res.error, "err");
      } else {
        showToast(
          pos
            ? `La posición ${pos} del jugador ${player.name} en el Equipo ${team.name}, fue actualizada correctamente`
            : `La posición del jugador ${player.name} en el Equipo ${team.name} fue removida correctamente`,
          "ok",
        );
      }
    } catch {
      assignPosition(player.id, previous);
      showToast("Error de conexión al guardar", "err");
    } finally {
      setSavingPosId(null);
    }
  };

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen");
      setLogoUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · CUENTA"
        title="Configuración"
        subtitle="Mantén al día tu contexto de trabajo."
      />

      {/* ─── Equipo del coach (parte superior) ─── */}
      {team.id ? (
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-5">
            {team.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-20 w-20 rounded-[14px] border-2 border-[#C9A24A]/40 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[14px] border-2 border-dashed border-white/15 bg-white/[0.02]">
                <span className="text-[24px]" style={{ fontFamily: S.barlow, color: "#686862" }}>🛡️</span>
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: S.barlow, color: S.gold }}>
                Mi equipo
              </p>
              <h2
                className="mt-1 truncate text-[28px] font-extrabold uppercase leading-none tracking-wide"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                {team.name}
              </h2>
              {team.code ? (
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: S.barlow, color: "#AAA69C" }}>
                  Código: <span className="font-bold text-[#C9A24A]">{team.code}</span> · {team.memberIds.length} miembro{team.memberIds.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>

          {/* ─── Cuadrícula de jugadores (nxn) ─── */}
          {team.members.length > 0 ? (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {team.members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setFicha(member)}
                  title={`${member.name} (@${member.username})`}
                  className="flex min-w-0 flex-col items-center gap-1.5 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-2 py-3 transition hover:border-[#C9A24A]/40 hover:bg-[#C9A24A]/[0.06]"
                  style={{ fontFamily: S.barlow }}
                >
                  <span className="relative">
                    {member.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-12 w-12 rounded-full border border-[#C9A24A]/25 object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A24A]/25 bg-[#C9A24A]/15 text-[11px] font-bold text-[#C9A24A]"
                      >
                        {initialsOf(member.name)}
                      </span>
                    )}
                    {member.lineupPosition ? (
                      <span
                        aria-hidden
                        className="absolute -bottom-1 -right-1 flex h-5 w-auto min-w-5 items-center justify-center rounded-full bg-[#C9A24A] px-1 text-[8px] font-black leading-none text-black shadow-md shadow-black/40"
                      >
                        {member.lineupPosition}
                      </span>
                    ) : null}
                  </span>
                  <span className="block w-full truncate text-[11px] font-bold" style={{ color: S.textPrimary }}>
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ─── Panel: Preferencias del entrenador / Configurar Equipo ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Preferencias del entrenador
            </h3>
            <p className="mt-2 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.gold }}>
              Configurar Equipo
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-[10px] border border-[#C9A24A]/25 px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          >
            Manejar Equipo
          </button>
        </div>

        {team.code ? (
          <p className="mt-4 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Código de invitación actual: <span className="font-bold text-[#C9A24A]">{team.code}</span>
            {" · "}
            {team.memberIds.length} miembro{team.memberIds.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </section>

      {/* ─── Modal: Configurar Equipo ─── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Configuración · Configurar Equipo" size="lg">
        <form action={formAction} onReset={(e) => e.preventDefault()} className="flex flex-col gap-5">
          <input type="hidden" name="teamId" value={team.id ?? ""} />
          <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />

          {/* Nombre del equipo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="team-name" className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: "#AAA69C" }}>
              Nombre del equipo
            </label>
            <input
              id="team-name"
              name="name"
              type="text"
              defaultValue={team.name}
              required
              minLength={2}
              maxLength={40}
              placeholder="Ej. Los Cracks FC"
              className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] font-bold outline-none transition focus:border-[#C9A24A]/50"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            />
          </div>

          {/* Logo del equipo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: "#AAA69C" }}>
              Logo del equipo
            </span>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt="Logo del equipo"
                  className="h-16 w-16 rounded-[12px] border border-[#C9A24A]/25 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-[12px] border border-dashed border-white/15 bg-white/[0.02]">
                  <span className="text-[18px]" style={{ fontFamily: S.barlow, color: "#686862" }}>🛡️</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-fit rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10 disabled:opacity-50"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  {uploading ? "Subiendo…" : logoUrl ? "Cambiar imagen" : "Subir imagen"}
                </button>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="w-fit text-left text-[11px] font-medium underline-offset-2 hover:underline"
                    style={{ fontFamily: S.barlow, color: "#686862" }}
                  >
                    Quitar logo
                  </button>
                ) : null}
                {uploadError ? (
                  <p className="text-[11px] font-medium text-red-400" style={{ fontFamily: S.barlow }}>{uploadError}</p>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          {/* Miembros del equipo */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: "#AAA69C" }}>
                Miembros
              </span>
              <span
                className={`text-[12px] font-extrabold uppercase tracking-[0.1em] ${
                  selected.size >= MAX_POSITIONS ? "text-emerald-400" : "text-[#C9A24A]"
                }`}
                style={{ fontFamily: S.barlow }}
              >
                {selected.size}/{MAX_POSITIONS} posiciones
              </span>
            </div>

            {/* Progreso hacia las 11 posiciones */}
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-[#C9A24A] transition-all"
                style={{ width: `${Math.min(100, (selected.size / MAX_POSITIONS) * 100)}%` }}
              />
            </div>

            {/* Buscador con sugerencias */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar jugador por nombre o @usuario…"
                className="w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-semibold outline-none transition focus:border-[#C9A24A]/50"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              />
              {suggestions.length > 0 ? (
                <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#0B0D0D] shadow-xl shadow-black/50">
                  {suggestions.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => selectPlayer(player.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-[#C9A24A]/10"
                    >
                      {player.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className="h-7 w-7 shrink-0 rounded-full border border-[#C9A24A]/25 object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A24A]/25 bg-[#C9A24A]/10 text-[9px] font-bold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                          {initialsOf(player.name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                        {player.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
                        @{player.username}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Seleccionados con posición asignable */}
            {selectedPlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/[0.07] p-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold leading-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                        {player.name}
                      </span>
                      <span className="block truncate text-[10px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
                        @{player.username}
                      </span>
                    </span>
                    <select
                      value={assignments[player.id] ?? ""}
                      onChange={(e) => changePosition(player, e.target.value)}
                      disabled={savingPosId === player.id}
                      className="w-[110px] shrink-0 rounded-[8px] border border-[#C9A24A]/30 bg-[#141414] px-1.5 py-1.5 text-[11px] font-bold outline-none transition focus:border-[#C9A24A]/60 disabled:opacity-50"
                      style={{ fontFamily: S.barlow, color: S.textPrimary }}
                      aria-label={`Posición de ${player.name}`}
                    >
                      <option value="">Sin posición</option>
                      {POSITIONS.map((pos) => {
                        const ocupada = Object.entries(assignments).some(
                          ([uid, code]) => uid !== player.id && code === pos.code,
                        );
                        return (
                          <option key={pos.code} value={pos.code} disabled={ocupada}>
                            {pos.code} · {pos.label}
                            {ocupada ? " (ocupada)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => removePlayer(player.id)}
                      aria-label={`Quitar a ${player.name}`}
                      className="shrink-0 rounded-full p-1 text-[#686862] transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Grid completo de jugadores (3 columnas) */}
            {players.length === 0 ? (
              <p className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
                No hay jugadores disponibles todavía.
              </p>
            ) : (
              <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto lg:grid-cols-3">
                {players.map((player) => {
                  const checked = selected.has(player.id);
                  const blocked = !checked && selected.size >= MAX_POSITIONS;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => (checked ? removePlayer(player.id) : selectPlayer(player.id))}
                      disabled={blocked}
                      className={`relative flex w-full min-w-0 items-center gap-2 rounded-[10px] border p-2.5 text-left transition ${
                        checked
                          ? "border-[#C9A24A]/60 bg-[#C9A24A]/[0.09]"
                          : "border-white/[0.05] bg-white/[0.02] hover:border-white/15"
                      } ${blocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                    >
                      {/* Check automático al quedar seleccionado */}
                      {checked ? (
                        <span
                          aria-hidden
                          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A24A] text-[11px] font-black leading-none text-black shadow-md shadow-black/40"
                          style={{ fontFamily: S.barlow }}
                        >
                          ✓
                        </span>
                      ) : null}
                      {player.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className={`h-8 w-8 shrink-0 rounded-full border object-cover ${checked ? "border-[#C9A24A]/70" : "border-[#C9A24A]/25"}`}
                        />
                      ) : (
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${checked ? "border-[#C9A24A]/70 bg-[#C9A24A]/20 text-[#E3C065]" : "border-[#C9A24A]/25 bg-[#C9A24A]/10 text-[#C9A24A]"}`} style={{ fontFamily: S.barlow }}>
                          {initialsOf(player.name)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold leading-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                          {player.name}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-[10px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
                            @{player.username}
                          </span>
                          {/* Código de posición asignada (se actualiza solo) */}
                          {checked && assignments[player.id] ? (
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wide" style={{ fontFamily: S.barlow, color: "#E3C065" }}>
                              {assignments[player.id]}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Entradas ocultas: "<userId>|<POSICION>" */}
          {selectedPlayers.map((player) => (
            <input
              key={player.id}
              type="hidden"
              name="members"
              value={`${player.id}|${assignments[player.id] ?? ""}`}
            />
          ))}

          {/* Guardar */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending || uploading}
              className="rounded-[10px] bg-[#C9A24A] px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#E3C065] disabled:opacity-50"
              style={{ fontFamily: S.barlow }}
            >
              {pending ? "Guardando…" : "Guardar configuración"}
            </button>
            {state?.error ? (
              <p className="text-[13px] font-bold text-red-400" style={{ fontFamily: S.barlow }}>{state.error}</p>
            ) : null}
            {state?.success ? (
              <p className="text-[13px] font-bold text-emerald-400" style={{ fontFamily: S.barlow }}>{state.success}</p>
            ) : null}
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Ficha del jugador ─── */}
      <Modal
        open={ficha !== null}
        onClose={() => setFicha(null)}
        title={`Jugador · ${ficha?.name ?? ""}`}
        size="md"
      >
        {ficha ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center" style={{ fontFamily: S.barlow }}>
            {ficha.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={ficha.avatarUrl}
                alt={ficha.name}
                className="h-20 w-20 rounded-full border border-[#C9A24A]/40 object-cover"
              />
            ) : (
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A24A]/40 bg-[#C9A24A]/15 text-[16px] font-extrabold text-[#C9A24A]"
              >
                {initialsOf(ficha.name)}
              </span>
            )}
            <div>
              <p className="text-[18px] font-bold leading-tight" style={{ color: S.textPrimary }}>
                {ficha.name}
              </p>
              <p className="text-[12px] font-medium" style={{ color: "#686862" }}>
                @{ficha.username}
              </p>
            </div>
            <div className="w-full rounded-[10px] border border-[#C9A24A]/25 bg-[#C9A24A]/[0.07] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#AAA69C" }}>
                Posición
              </p>
              <p className="mt-1 text-[14px] font-extrabold" style={{ color: "#E3C065" }}>
                {ficha.lineupPosition
                  ? `${ficha.lineupPosition} · ${POSITIONS.find((p) => p.code === ficha.lineupPosition)?.label ?? ""}`
                  : "Sin posición"}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Alert toast */}
      {toast
        ? createPortal(
            <div
              role="alert"
              className={`fixed left-1/2 top-6 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-[12px] border px-4 py-3 shadow-2xl shadow-black/60 ${
                toast.kind === "ok"
                  ? "border-[#C9A24A]/50 bg-[#0B0D0D]"
                  : "border-red-500/50 bg-[#1A0D0D]"
              }`}
              style={{ fontFamily: S.barlow }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black ${
                  toast.kind === "ok" ? "bg-[#C9A24A] text-black" : "bg-red-500 text-white"
                }`}
                aria-hidden
              >
                {toast.kind === "ok" ? "✓" : "!"}
              </span>
              <p
                className={`text-[13px] font-bold leading-snug ${
                  toast.kind === "ok" ? "text-[#F3F0E8]" : "text-red-400"
                }`}
              >
                {toast.msg}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
