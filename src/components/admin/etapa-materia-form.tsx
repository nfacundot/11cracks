"use client";

import { useActionState, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveClase, saveTema, deleteClase, deleteTema, assignTema, unassignTema } from "@/actions/admin";
import { Modal } from "@/components/admin/modal";
import { PlusIcon } from "@/components/icons";
import { useConfirmDialog } from "@/components/confirm-dialog";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white";

const EMOJIS = [
  "⚽", "🏆", "🥅", "🥇", "🥈", "🥉",
  "🏅", "🎖️", "⭐", "🔥", "💪", "🧠",
  "📚", "📖", "✏️", "🎓", "📝", "💡",
  "👟", "🧤", "🟢", "🔴", "🔵", "🟡",
  "🟠", "🟣", "⚪", "🔺", "🔷", "🏃",
  "⏱️", "📈", "🗺️", "🎯", "✅", "🎲",
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name="emoji" value={value} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 text-xl transition ${
          open
            ? "border-green-400 bg-green-500/10"
            : "border-green-100 bg-white/60 hover:bg-green-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-800"
        }`}
      >
        <span>{value || "⭐"}</span>
        <span
          className={`text-xs text-zinc-400 transition-transform dark:text-zinc-500 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-green-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/95">
          <div className="grid grid-cols-5 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onChange(e);
                  setOpen(false);
                }}
                className={`flex h-10 items-center justify-center rounded-lg text-xl transition active:scale-90 ${
                  value === e
                    ? "bg-green-500/15 ring-2 ring-green-500"
                    : "bg-zinc-50 hover:bg-green-50 dark:bg-emerald-900 dark:hover:bg-emerald-800"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded-lg border-2 border-green-100 bg-white dark:border-emerald-800"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} w-28 font-mono`}
      />
    </label>
  );
}

export function ClaseForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: { id: string; name: string; description: string; emoji: string; color: string; order: number };
  onSuccess?: () => void;
}) {
  const [emoji, setEmoji] = useState(defaultValues?.emoji ?? "🗺️");
  const [color, setColor] = useState(defaultValues?.color ?? "#16a34a");
  const [state, formAction, pending] = useActionState(saveClase, undefined);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <input type="hidden" name="id" value={defaultValues?.id ?? ""} />
      <h4 className="mb-3 font-black text-emerald-950 dark:text-white">
        {defaultValues ? "Editar etapa" : "Nueva etapa"}
      </h4>
      <div className="space-y-3">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Nombre de la etapa (ej. Fundamentos del fútbol)"
          className={inputCls}
          required
        />
        <input
          type="text"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Descripción opcional"
          className={inputCls}
        />
        <div className="flex items-center gap-3">
          <ColorField value={color} onChange={setColor} />
          <input
            type="hidden"
            name="color"
            value={color}
          />
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            Orden
            <input
              type="number"
              name="order"
              defaultValue={defaultValues?.order ?? 0}
              className={`${inputCls} w-20`}
            />
          </label>
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm font-bold text-red-500">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm font-bold text-green-600">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-green-500 py-2.5 text-sm font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
      >
        {defaultValues ? "Guardar cambios" : "Crear etapa"}
      </button>
    </form>
  );
}

export function DeleteClaseButton({ id, hasTemas }: { id: string; hasTemas: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          const msg = hasTemas
            ? "Las materias de esta etapa seguirán asignadas a las demás etapas. ¿Continuar?"
            : "¿Seguro que quieres eliminar esta etapa?";
          if (!(await confirm(msg))) return;
          startTransition(() => {
            void deleteClase(id).then(() => router.refresh());
          });
        }}
        className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
      >
        Eliminar
      </button>
      {node}
    </>
  );
}

export function TemaForm({
  clases,
  clasesIniciales,
  defaultValues,
  onSuccess,
}: {
  clases: { id: string; name: string; emoji: string }[];
  clasesIniciales?: string[];
  defaultValues?: { id: string; name: string; emoji: string; color: string; order: number; xpReward: number };
  onSuccess?: () => void;
}) {
  const [emoji, setEmoji] = useState(defaultValues?.emoji ?? "⭐");
  const [color, setColor] = useState(defaultValues?.color ?? "#16a34a");
  const [selectedClases, setSelectedClases] = useState<string[]>(clasesIniciales ?? []);
  const [state, formAction, pending] = useActionState(saveTema, undefined);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const toggleClase = (claseId: string) => {
    setSelectedClases((prev) =>
      prev.includes(claseId) ? prev.filter((id) => id !== claseId) : [...prev, claseId]
    );
  };

  return (
    <form action={formAction} className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <input type="hidden" name="id" value={defaultValues?.id ?? ""} />
      <h4 className="mb-3 font-black text-emerald-950 dark:text-white">
        {defaultValues ? "Editar materia" : "Nueva materia"}
      </h4>
      <div className="space-y-3">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Nombre de la materia"
          className={inputCls}
          required
        />
        <fieldset>
          <legend className="mb-1.5 text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Etapas donde aparece
          </legend>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {clases.map((clase) => {
              const checked = selectedClases.includes(clase.id);
              return (
                <label
                  key={clase.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                    checked
                      ? "border-green-400 bg-green-500/10"
                      : "border-green-100 bg-white/60 hover:bg-green-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="clases"
                    value={clase.id}
                    checked={checked}
                    onChange={() => toggleClase(clase.id)}
                    className="h-4 w-4 accent-green-500"
                  />
                  <span>
                    {clase.emoji} {clase.name}
                  </span>
                </label>
              );
            })}
            {clases.length === 0 && (
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Aún no hay etapas. Créalas primero en &quot;Nueva etapa&quot;.
              </p>
            )}
          </div>
        </fieldset>
        <div className="flex items-center gap-3">
          <ColorField value={color} onChange={setColor} />
          <input type="hidden" name="color" value={color} />
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            Orden
            <input type="number" name="order" defaultValue={defaultValues?.order ?? 0} className={`${inputCls} w-20`} />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            XP
            <input type="number" name="xpReward" defaultValue={defaultValues?.xpReward ?? 60} className={`${inputCls} w-20`} />
          </label>
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm font-bold text-red-500">{state.error}</p>}
      {state?.success && <p className="mt-3 text-sm font-bold text-green-600">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-green-500 py-2.5 text-sm font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
      >
        {defaultValues ? "Guardar cambios" : "Crear materia"}
      </button>
    </form>
  );
}

export function AssignTemaSelect({
  claseId,
  unassigned,
}: {
  claseId: string;
  unassigned: { id: string; name: string; emoji: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [temaId, setTemaId] = useState("");

  if (unassigned.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        value={temaId}
        onChange={(e) => setTemaId(e.target.value)}
        className={inputCls}
        aria-label="Materia de otra etapa"
      >
        <option value="">Asociar materia…</option>
        {unassigned.map((s) => (
          <option key={s.id} value={s.id}>
            {s.emoji} {s.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !temaId}
        onClick={() => {
          startTransition(() => {
            void assignTema(temaId, claseId).then(() => {
              setTemaId("");
              router.refresh();
            });
          });
        }}
        className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white transition hover:bg-green-700 active:scale-95 disabled:opacity-50"
      >
        Asociar
      </button>
    </div>
  );
}

export function UnassignTemaButton({ id, claseId }: { id: string; claseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void unassignTema(id, claseId).then(() => router.refresh());
        });
      }}
      className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-600 transition hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-950/40"
    >
      Separar
    </button>
  );
}

export function DeleteTemaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (
            !(await confirm(
              "¿Seguro que quieres eliminar esta materia? Sus lecciones se quedarán sin materia."
            ))
          )
            return;
          startTransition(() => {
            void deleteTema(id).then(() => router.refresh());
          });
        }}
        className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
      >
        Eliminar
      </button>
      {node}
    </>
  );
}

export function NewClaseModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-600"
      >
        <PlusIcon className="h-4 w-4" />
        Nueva etapa
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva etapa">
        {children ?? <ClaseForm onSuccess={() => setOpen(false)} />}
      </Modal>
    </>
  );
}

export function NewTemaModal({
  clases,
  clasesIniciales,
  children,
}: {
  clases: { id: string; name: string; emoji: string }[];
  clasesIniciales?: string[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-600"
      >
        <PlusIcon className="h-4 w-4" />
        Nueva materia
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva materia">
        {children ?? (
          <TemaForm clases={clases} clasesIniciales={clasesIniciales} onSuccess={() => setOpen(false)} />
        )}
      </Modal>
    </>
  );
}

export function EditTemaModal({
  tema,
  clases,
}: {
  tema: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    order: number;
    xpReward: number;
    clases: { id: string }[];
  };
  clases: { id: string; name: string; emoji: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-emerald-900"
      >
        Editar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Editar ${tema.name}`}>
        <TemaForm
          clases={clases}
          clasesIniciales={tema.clases.map((c) => c.id)}
          defaultValues={{
            id: tema.id,
            name: tema.name,
            emoji: tema.emoji,
            color: tema.color,
            order: tema.order,
            xpReward: tema.xpReward,
          }}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
