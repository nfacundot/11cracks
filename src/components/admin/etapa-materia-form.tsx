"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
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
  return (
    <div>
      <input type="hidden" name="emoji" value={value} />
      <div className="grid grid-cols-6 gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
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
        {defaultValues ? "Editar clase" : "Nueva clase"}
      </h4>
      <div className="space-y-3">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Nombre de la clase (ej. Fundamentos del fútbol)"
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
        {defaultValues ? "Guardar cambios" : "Crear clase"}
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
            ? "Los temas de esta clase quedarán sin clase asignada. ¿Continuar?"
            : "¿Seguro que quieres eliminar esta clase?";
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
  claseId,
  defaultValues,
  onSuccess,
}: {
  clases: { id: string; name: string; emoji: string }[];
  claseId?: string;
  defaultValues?: { id: string; name: string; emoji: string; color: string; order: number; xpReward: number };
  onSuccess?: () => void;
}) {
  const [emoji, setEmoji] = useState(defaultValues?.emoji ?? "⭐");
  const [color, setColor] = useState(defaultValues?.color ?? "#16a34a");
  const [selectedClase, setSelectedClase] = useState(claseId ?? "");
  const [state, formAction, pending] = useActionState(saveTema, undefined);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <input type="hidden" name="id" value={defaultValues?.id ?? ""} />
      <input type="hidden" name="claseId" value={selectedClase} />
      <h4 className="mb-3 font-black text-emerald-950 dark:text-white">
        {defaultValues ? "Editar tema" : "Nueva tema"}
      </h4>
      <div className="space-y-3">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          type="text"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Nombre del tema"
          className={inputCls}
          required
        />
        <select
          value={selectedClase}
          onChange={(e) => setSelectedClase(e.target.value)}
          className={inputCls}
          aria-label="Clase"
        >
          <option value="">Sin clase (asíguala después)</option>
          {clases.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.name}
            </option>
          ))}
        </select>
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
        {defaultValues ? "Guardar cambios" : "Crear tema"}
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
        aria-label="Tema sin clase"
      >
        <option value="">Asociar tema…</option>
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

export function UnassignTemaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void unassignTema(id).then(() => router.refresh());
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
              "¿Seguro que quieres eliminar este tema? Sus lecciones se quedarán sin tema."
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
        Nueva clase
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva clase">
        {children ?? <ClaseForm onSuccess={() => setOpen(false)} />}
      </Modal>
    </>
  );
}

export function NewTemaModal({
  clases,
  children,
}: {
  clases: { id: string; name: string; emoji: string }[];
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
        Nueva tema
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva tema">
        {children ?? <TemaForm clases={clases} onSuccess={() => setOpen(false)} />}
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
    claseId: string | null;
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
          claseId={tema.claseId ?? ""}
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
