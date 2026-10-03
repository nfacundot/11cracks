"use client";

import { useActionState } from "react";
import {
  createTrophy,
  deleteTrophy,
  toggleTrophyActive,
  updateTrophy,
  type TrophyState,
} from "@/actions/trophies";
import { TROPHY_METRICS, metricLabel } from "@/lib/trophies";

export type TrophyRow = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  metric: string;
  target: number;
  order: number;
  active: boolean;
};

const field =
  "w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-semibold outline-none transition focus:border-[#C9A24A]/50";
const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.1em] text-[#686862]";

function TrophyFields({ trophy }: { trophy?: TrophyRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Nombre</span>
        <input name="name" defaultValue={trophy?.name ?? ""} required minLength={2} maxLength={60} placeholder="Impacto" className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Subtítulo</span>
        <input name="subtitle" defaultValue={trophy?.subtitle ?? ""} maxLength={80} placeholder="Jugador que suma" className={field} />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={fieldLabel}>Descripción</span>
        <input name="description" defaultValue={trophy?.description ?? ""} maxLength={160} placeholder="Participación en el ecosistema" className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Icono</span>
        <input name="icon" defaultValue={trophy?.icon ?? "🏆"} maxLength={8} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Condición (métrica)</span>
        <select name="metric" defaultValue={trophy?.metric ?? TROPHY_METRICS[0].key} className={field}>
          {TROPHY_METRICS.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Meta</span>
        <input name="target" type="number" min={1} max={1000000} defaultValue={trophy?.target ?? 1} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>Orden</span>
        <input name="order" type="number" defaultValue={trophy?.order ?? 0} className={field} />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={trophy?.active ?? true} className="size-4 accent-[#C9A24A]" />
        <span className="text-[12px] font-semibold text-(--text-primary)">Activo</span>
      </label>
    </div>
  );
}

export function TrophiesManager({ trophies }: { trophies: TrophyRow[] }) {
  const [state, formAction, pending] = useActionState<TrophyState, FormData>(createTrophy, undefined);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3 rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5">
        <div>
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-(--text-primary)">Nuevo trofeo</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#686862]">
            Define la condición que lo desbloquea
          </p>
        </div>
        <TrophyFields />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-[10px] bg-[#C9A24A] px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.1em] text-black transition hover:bg-[#E3C065] disabled:opacity-50"
          >
            {pending ? "Creando…" : "Crear trofeo"}
          </button>
          {state?.error ? <p className="text-[13px] font-bold text-red-400">{state.error}</p> : null}
          {state?.success ? <p className="text-[13px] font-bold text-emerald-400">{state.success}</p> : null}
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {trophies.length === 0 ? (
          <p className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 text-[13px] text-[#686862]">
            Aún no hay trofeos. Crea el primero con el formulario de arriba.
          </p>
        ) : (
          trophies.map((trophy) => (
            <details key={trophy.id} className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="text-[22px] leading-none">{trophy.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-(--text-primary)">{trophy.name}</p>
                  <p className="truncate text-[11px] font-medium text-[#686862]">
                    {trophy.subtitle || trophy.description || "Sin descripción"} · {metricLabel(trophy.metric)} · meta {trophy.target}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${trophy.active ? "text-emerald-400" : "text-[#686862]"}`}>
                  {trophy.active ? "Activo" : "Inactivo"}
                </span>
              </summary>

              <div className="mt-4 flex flex-col gap-3">
                <form action={updateTrophy} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={trophy.id} />
                  <TrophyFields trophy={trophy} />
                  <button
                    type="submit"
                    className="self-start rounded-[10px] border border-[#C9A24A]/30 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-(--text-primary) transition hover:border-[#C9A24A]/60 hover:bg-[#C9A24A]/10"
                  >
                    Guardar cambios
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  <form action={toggleTrophyActive}>
                    <input type="hidden" name="id" value={trophy.id} />
                    <input type="hidden" name="active" value={trophy.active ? "0" : "1"} />
                    <button
                      type="submit"
                      className="rounded-[10px] border border-white/[0.12] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-(--text-primary) transition hover:border-white/30"
                    >
                      {trophy.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <form action={deleteTrophy}>
                    <input type="hidden" name="id" value={trophy.id} />
                    <button
                      type="submit"
                      className="rounded-[10px] border border-red-500/25 bg-red-500/[0.06] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-red-400 transition hover:border-red-500/50 hover:bg-red-500/15"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
