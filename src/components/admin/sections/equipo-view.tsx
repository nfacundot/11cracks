"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { Modal } from "@/components/admin/modal";
import { Avatar } from "@/components/avatar";
import { AlertTriangle } from "lucide-react";
import { registerPlayerAndEnrollAction } from "@/app/actions/coach-team";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "PLAYER", label: "Jugador" },
  { value: "CAPTAIN", label: "Capitán" },
  { value: "COACH", label: "Entrenador" },
  { value: "OWNER", label: "Dueño" },
];

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
  teamId,
  teamName,
  members,
}: {
  teamId: string;
  teamName: string;
  members: TeamMemberData[];
}) {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<TeamMemberData | null>(null);
  const [inscribir, setInscribir] = useState(false);
  const [page, setPage] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nivel = (xp: number) => Math.floor(xp / 100) + 1;
  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => members.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE),
    [members, currentPage]
  );

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · PLANTEL"
        title="Mi equipo"
        subtitle="Consulta, acompaña y sigue la evolución de tu plantel."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/25 tk-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ fontFamily: S.barlow, color: S.gold }}
            >
              PLANTEL DEL EQUIPO
            </p>
            <h2
              className="mt-1 text-[18px] font-extrabold"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Jugadores asignados
            </h2>
            <p
              className="mt-1 text-[12px]"
              style={{ fontFamily: S.barlow, color: S.textSecondary }}
            >
              Gestiona las personas inscritas en tu equipo, dentro de tu alcance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInscribir(true)}
            disabled={!teamId}
            className="shrink-0 rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition hover:bg-[#C9A24A]/20 disabled:opacity-40"
            style={{ fontFamily: S.barlow, color: S.gold }}
          >
            Inscribir jugador
          </button>
        </div>
      </section>

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
        <div className="overflow-hidden rounded-[14px] border border-white/[0.05] tk-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left" style={{ fontFamily: S.barlow }}>
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Jugador", "Posición", "Nivel", "XP", "Racha", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: S.textSecondary }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={m.name}
                          src={m.avatarUrl}
                          config={m.avatarConfig as never}
                          size={36}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold" style={{ color: S.textPrimary }}>
                            {m.name}
                          </p>
                          <p className="truncate text-[11px] font-medium" style={{ color: S.textSecondary }}>
                            @{m.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: S.textSecondary }}>
                      {positionLabel(m.lineupPosition)}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-extrabold" style={{ color: S.gold }}>
                      Nv.{nivel(m.xp)}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: S.textPrimary }}>
                      {m.xp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: S.textPrimary }}>
                      {m.currentStreak}d
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSeleccionado(m)}
                        className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                        style={{ color: S.textPrimary }}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3"
            style={{ fontFamily: S.barlow }}
          >
            <p className="text-[11px] font-semibold" style={{ color: S.textSecondary }}>
              {members.length === 0
                ? "Sin registros"
                : `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, members.length)} de ${members.length}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-[8px] border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase disabled:opacity-40"
                style={{ color: S.textPrimary }}
              >
                Anterior
              </button>
              <span className="text-[11px] font-bold" style={{ color: S.textSecondary }}>
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-[8px] border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase disabled:opacity-40"
                style={{ color: S.textPrimary }}
              >
                Siguiente
              </button>
            </div>
          </div>
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

      {/* ─── Modal: Inscribir jugador ─── */}
      <Modal
        open={inscribir}
        onClose={() => setInscribir(false)}
        title="Inscribir jugador"
        size="md"
      >
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const res = await registerPlayerAndEnrollAction(formData);
              if (res.ok) {
                setInscribir(false);
                router.refresh();
              } else {
                setError(res.error);
              }
            });
          }}
          className="flex flex-col gap-4"
          style={{ fontFamily: S.barlow }}
        >
          <input type="hidden" name="teamId" value={teamId} />

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Nombre
            </span>
            <input
              name="name"
              required
              placeholder="Nombre y apellido"
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Usuario
            </span>
            <input
              name="username"
              required
              placeholder="nombre.usuario"
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Correo electrónico
            </span>
            <input
              name="email"
              type="email"
              required
              placeholder="jugador@correo.com"
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Contraseña
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Rol en el equipo
            </span>
            <select
              name="role"
              defaultValue="PLAYER"
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: S.textSecondary }}>
              Posición
            </span>
            <select
              name="lineupPosition"
              defaultValue=""
              className="rounded-[10px] border border-white/10 tk-control px-3 py-2.5 text-[13px] outline-none focus:border-[#C9A24A]/50"
              style={{ color: S.textPrimary }}
            >
              <option value="">Sin posición</option>
              {POSITIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} · {p.label}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/15 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/25 disabled:opacity-50"
            style={{ color: S.gold }}
          >
            {pending ? "Inscribiendo…" : "Inscribir"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
