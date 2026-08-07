"use client";

import { useActionState } from "react";
import { createTeam, joinTeam, type TeamState } from "@/actions/team";

const inputCls =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-green-400";

export function TeamForm() {
  const [createState, createAction, createPending] = useActionState<TeamState, FormData>(
    createTeam,
    undefined
  );
  const [joinState, joinAction, joinPending] = useActionState<TeamState, FormData>(
    joinTeam,
    undefined
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100">
        <h2 className="mb-3 font-black">Crear equipo</h2>
        <form action={createAction} className="flex flex-col gap-3">
          {createState?.error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {createState.error}
            </p>
          )}
          {createState?.success && (
            <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-600">
              {createState.success}
            </p>
          )}
          <input name="name" required minLength={2} maxLength={40} placeholder="Nombre del equipo" className={inputCls} />
          <input name="description" placeholder="Descripción (opcional)" className={inputCls} />
          <button
            type="submit"
            disabled={createPending}
            className="rounded-2xl bg-green-500 py-3 font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-60"
          >
            {createPending ? "Creando..." : "Crear equipo"}
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100">
        <h2 className="mb-3 font-black">Unirse con código</h2>
        <form action={joinAction} className="flex flex-col gap-3">
          {joinState?.error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
              {joinState.error}
            </p>
          )}
          {joinState?.success && (
            <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-600">
              {joinState.success}
            </p>
          )}
          <input
            name="code"
            required
            placeholder="Código del equipo (ej: A1B2C3D4)"
            className={`${inputCls} font-mono uppercase tracking-widest`}
          />
          <button
            type="submit"
            disabled={joinPending}
            className="rounded-2xl bg-emerald-950 py-3 font-black text-white transition hover:bg-emerald-900 active:scale-95 disabled:opacity-60"
          >
            {joinPending ? "Uniéndote..." : "Unirse"}
          </button>
        </form>
      </section>
    </div>
  );
}
