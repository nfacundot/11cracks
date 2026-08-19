"use client";

import { useState } from "react";
import { useActionState } from "react";
import { upsertIndicator, deleteIndicator, type AdminState } from "@/actions/admin";
import { PlusIcon, XIcon, PencilIcon } from "@/components/icons";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white";

type IndicatorData = {
  id: string;
  name: string;
  category: "DEPORTE" | "NEUROCRACKS";
  percentage: number;
  userId: string | null;
  user: { name: string; username: string } | null;
};

export function IndicatorManager({
  indicators,
}: {
  indicators: IndicatorData[];
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(upsertIndicator, undefined);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<IndicatorData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedMsg, setDeletedMsg] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setModal("create");
  };

  const openEdit = (ind: IndicatorData) => {
    setEditing(ind);
    setModal("edit");
  };

  const close = () => {
    setModal(null);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteIndicator(id);
    setConfirmDeleteId(null);
    setDeletedMsg(true);
    setTimeout(() => setDeletedMsg(false), 2500);
  };

  return (
    <div className="space-y-6">
      {deletedMsg && (
        <div className="fixed top-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-green-500 px-6 py-3 text-sm font-black text-white shadow-xl">
          Eliminado correctamente
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Indicadores</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Creamos los indicadores y los asignamos por usuario.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-green-200 transition hover:bg-green-600 active:scale-95 dark:shadow-green-950"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo indicador
        </button>
      </div>

      {indicators.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-400 dark:bg-emerald-900 dark:text-zinc-500">
          No hay indicadores creados todavía.
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
          {indicators.map((ind) => (
            <div
              key={ind.id}
              className="flex items-center gap-3 rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60"
            >
              <p className="flex-1 min-w-0 truncate text-sm font-black text-emerald-950 dark:text-white">{ind.name}</p>
              <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-emerald-800/60 dark:text-zinc-400">
                {ind.category === "NEUROCRACKS" ? "Neuro" : "Deporte"}
              </span>
              {ind.user && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-emerald-800">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${ind.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-emerald-950 dark:text-white">
                    {ind.percentage}%
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => openEdit(ind)}
                className="shrink-0 rounded-lg p-1.5 text-green-600 transition hover:bg-green-50 dark:text-green-400"
                aria-label="Editar"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(ind.id)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                aria-label="Eliminar"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-red-900 dark:bg-emerald-950/90">
            <h3 className="text-lg font-black text-emerald-950 dark:text-white">Eliminar indicador</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Seguro que quieres eliminar este indicador? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-600 active:scale-95"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-xl border-2 border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-emerald-800 dark:text-zinc-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            action={action}
            className="w-full max-w-md rounded-2xl border border-green-100 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-emerald-900 dark:bg-emerald-950/90"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-950 dark:text-white">
                {modal === "create" ? "Nuevo indicador" : `Editar: ${editing?.name}`}
              </h3>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-emerald-900"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {state?.error && (
              <p className="mb-3 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-500 dark:bg-red-950/40 dark:text-red-400">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="mb-3 rounded-xl bg-green-100 p-3 text-sm font-bold text-green-600 dark:bg-green-950/40 dark:text-green-400">
                {state.success}
              </p>
            )}

            {editing && <input type="hidden" name="indicatorId" value={editing.id} />}

            <div className="space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-500">NOMBRE DEL INDICADOR</span>
                <input
                  type="text"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="Ej: Control del balón"
                  className={inputCls}
                  required
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-500">CATEGORÍA</span>
                <select
                  name="category"
                  defaultValue={editing?.category ?? "DEPORTE"}
                  className={inputCls}
                >
                  <option value="DEPORTE">Deporte</option>
                  <option value="NEUROCRACKS">Neurocracks</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
              >
                {pending ? "Guardando…" : modal === "create" ? "Crear" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-xl border-2 border-green-200 px-5 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
