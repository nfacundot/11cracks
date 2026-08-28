"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { Modal } from "@/components/admin/modal";
import { Avatar } from "@/components/avatar";
import { AlertTriangle } from "lucide-react";

export type TeamMemberData = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  avatarConfig: Record<string, unknown> | null;
  lineupPosition: string | null;
  xp: number;
  currentStreak: number;
  bestStreak: number;
  bio: string | null;
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

function positionLabel(code: string | null): string {
  if (!code) return "Sin posición";
  return `${code} · ${POSITIONS.find((p) => p.code === code)?.label ?? code}`;
}

export function EquipoView({
  teamName,
  members,
}: {
  teamName: string;
  members: TeamMemberData[];
}) {
  const [seleccionado, setSeleccionado] = useState<TeamMemberData | null>(null);

  const nivel = (xp: number) => Math.floor(xp / 100) + 1;

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · PLANTEL"
        title="Mi equipo"
        subtitle="Consulta, acompaña y sigue la evolución de tu plantel."
      />

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[14px] border border-amber-500/20 bg-amber-500/[0.06] px-6 py-10 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <p
            className="text-[15px] font-bold"
            style={{ fontFamily: S.barlow, color: S.textPrimary }}
          >
            Sin miembros en equipo{teamName ? ` "${teamName}"` : ""}
          </p>
          <p
            className="text-[13px]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Agrega jugadores desde{" "}
            <span className="font-semibold" style={{ color: S.gold }}>
              Configuración
            </span>{" "}
            para comenzar a gestionar tu plantel.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-[12px] border border-white/[0.05] bg-[#080909]/85 px-4 py-3 transition hover:border-[#C9A24A]/30"
              style={{ fontFamily: S.barlow }}
            >
              <Avatar
                name={m.name}
                src={m.avatarUrl}
                config={m.avatarConfig as never}
                size={44}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold" style={{ color: S.textPrimary }}>
                  {m.name}
                </p>
                <p className="truncate text-[11px] font-medium" style={{ color: S.textSecondary }}>
                  {positionLabel(m.lineupPosition)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className="text-[12px] font-extrabold"
                  style={{ color: S.gold }}
                >
                  Nv.{nivel(m.xp)}
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: S.textSecondary }}
                >
                  0%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSeleccionado(m)}
                className="shrink-0 rounded-[10px] border border-[#C9A24A]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Ver Ficha
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal: Ficha del jugador ─── */}
      <Modal
        open={seleccionado !== null}
        onClose={() => setSeleccionado(null)}
        title={`Ficha · ${seleccionado?.name ?? ""}`}
        size="md"
      >
        {seleccionado ? (
          <div className="flex flex-col gap-5">
            {/* Cabecera */}
            <div className="flex items-center gap-4">
              <Avatar
                name={seleccionado.name}
                src={seleccionado.avatarUrl}
                config={seleccionado.avatarConfig as never}
                size={72}
              />
              <div className="min-w-0">
                <p className="text-[20px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {seleccionado.name}
                </p>
                <p className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                  @{seleccionado.username}
                </p>
              </div>
            </div>

            {/* Posición */}
            <div className="w-full rounded-[10px] border border-[#C9A24A]/25 bg-[#C9A24A]/[0.07] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                Posición
              </p>
              <p className="mt-1 text-[14px] font-extrabold" style={{ fontFamily: S.barlow, color: S.gold }}>
                {positionLabel(seleccionado.lineupPosition)}
              </p>
            </div>

            {/* Bio */}
            {seleccionado.bio && (
              <p
                className="rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-[13px] italic"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                &ldquo;{seleccionado.bio}&rdquo;
              </p>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nivel", value: `${nivel(seleccionado.xp)}` },
                { label: "XP total", value: seleccionado.xp.toLocaleString() },
                { label: "Racha actual", value: `${seleccionado.currentStreak}d` },
                { label: "Asistencia", value: "0%" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-3"
                >
                  <span
                    className="text-[20px] font-extrabold"
                    style={{ fontFamily: S.barlow, color: S.gold }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ fontFamily: S.barlow, color: S.textSecondary }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {seleccionado.bestStreak > 0 && (
              <p
                className="text-center text-[12px] font-medium"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                Mejor racha:{" "}
                <span className="font-bold" style={{ color: S.gold }}>
                  {seleccionado.bestStreak} días
                </span>
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
