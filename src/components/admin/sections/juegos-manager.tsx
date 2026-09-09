"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGame, saveGame, type GameState } from "@/actions/games";
import { GAME_CATEGORY_META } from "@/lib/games";
import type { GameCategory } from "@/lib/games";
import { PlusIcon, XIcon, ChevronDownIcon } from "@/components/icons";
import { AlertDialog, ConfirmDialog } from "@/components/shared/dialog";

const GAME_EMOJIS = [
  "🎮", "🎯", "🏆", "🎲", "🃏", "🧩", "🧠", "💡",
  "🔤", "📝", "🗣️", "👂", "👁️", "🎧", "🔊", "📢",
  "⚽", "🥅", "🏟️", "⚾", "🏀", "🏈", "🎾", "🏓",
  "🎨", "🖌️", "🎭", "🎪", "🎟️", "🎫", "🏅", "🥇",
  "🌟", "✨", "💫", "🌈", "☀️", "🌙", "⭐", "💎",
  "🚀", "🛸", "🌍", "🌎", "🌏", "🗺️", "🧭", "📍",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
  "🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🥭", "🍍",
  "🎁", "🎀", "🎊", "🎉", "🧨", "🎇", "🎆",
  "📚", "📖", "📕", "📗", "📘", "📙", "📓", "📒",
  "🎹", "🎸", "🎺", "🎻", "🥁", "🎷", "🪕", "🎶",
];

function IconPicker({ value, onChange, placeholder }: { value: string; onChange: (emoji: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = GAME_EMOJIS.filter((e) => e.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border-2 border-green-100 bg-white/60 px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-xl">{value || placeholder}</span>
        <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={gridRef}
          className="absolute z-50 mt-1 w-full max-h-80 overflow-auto rounded-xl border-2 border-green-100 bg-white/95 p-3 shadow-lg backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/95"
          role="listbox"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar emoji..."
            className="mb-2 w-full rounded-xl border-2 border-green-100 bg-white/60 px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white"
          />
          <div className="grid grid-cols-5 gap-1.5" role="listbox">
            {filtered.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition hover:bg-green-50 active:scale-95 dark:hover:bg-emerald-900/30"
                role="option"
                aria-selected={value === emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm font-bold text-zinc-400 py-4">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white";

export type GameViewModel = {
  id: string;
  slug: string;
  name: string;
  category: GameCategory;
  emoji: string;
  color: string;
  description: string | null;
  active: boolean;
  wordCount: number;
  lessonXp: number | null;
};

type GameDraft = {
  id?: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  xpReward: number;
};

function GameForm({
  initial,
  onDone,
}: {
  initial: GameDraft | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<GameState, FormData>(saveGame, undefined);
  const [draft, setDraft] = useState<GameDraft>(() =>
    initial
      ? initial
      : { name: "", category: "OIDO", description: "", emoji: "", xpReward: 25 }
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  const submit = (formData: FormData) => {
    formData.set("id", draft.id ?? "");
    formData.set("name", draft.name);
    formData.set("category", draft.category);
    formData.set("description", draft.description);
    formData.set("emoji", draft.emoji);
    formData.set("xpReward", String(draft.xpReward));
    formAction(formData);
  };

  return (
    <form
      action={submit}
      className="space-y-4 rounded-2xl border border-green-100 bg-white/60 p-5 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            {initial ? "Editar lección" : "Nueva lección"}
        </h3>
        {state?.success ? (
          <span className="text-sm font-black text-green-600 dark:text-green-400">{state.success}</span>
        ) : null}
        {state?.error ? (
          <span className="text-sm font-black text-red-500">{state.error}</span>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Nombre de la lección
        </label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Ej: Oído de Crack"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] font-bold text-zinc-400">
          Es el nombre que verán los jugadores.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Tipo de lección
          </label>
          <select
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className={inputCls}
          >
            {Object.entries(GAME_CATEGORY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.emoji} {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Emoji (opcional)
          </label>
          <IconPicker
            value={draft.emoji}
            onChange={(emoji) => setDraft((d) => ({ ...d, emoji }))}
            placeholder={GAME_CATEGORY_META[draft.category as keyof typeof GAME_CATEGORY_META].emoji}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Descripción (opcional)
        </label>
        <input
          type="text"
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Ej: Escucha la palabra y elige la imagen correcta."
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          XP por lección
        </label>
        <input
          type="number"
          min={0}
          max={500}
          value={draft.xpReward}
          onChange={(e) => setDraft((d) => ({ ...d, xpReward: Math.max(0, Number(e.target.value) || 0) }))}
          className={inputCls}
        />
        <p className="mt-1 text-[11px] font-bold text-zinc-400">
          Cuánto XP gana el jugador al completar este juego.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        {state?.error ? (
          <span className="mr-auto text-sm font-black text-red-500">{state.error}</span>
        ) : null}
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border-2 border-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-60 dark:shadow-green-950"
        >
          {pending ? "Guardando..." : initial ? "Guardar cambios" : "Crear lección"}
        </button>
      </div>
    </form>
  );
}

export function JuegosManager({ games }: { games: GameViewModel[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GameViewModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; game: GameViewModel | null }>({
    open: false,
    game: null,
  });
  const [errorAlert, setErrorAlert] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const refresh = () => router.refresh();

  const handleDelete = (game: GameViewModel) => {
    setDeleteConfirm({ open: true, game });
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (!confirmed || !deleteConfirm.game) return;
    const result = await deleteGame(deleteConfirm.game.id);
    if (result?.error) setErrorAlert({ open: true, message: result.error });
    else {
      setEditing(null);
      refresh();
    }
  };

  const categoryMeta = (category: GameCategory) => GAME_CATEGORY_META[category];

  return (
    <>
      <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            Lecciones <span className="text-zinc-400">({games.length})</span>
          </h3>
          <p className="text-xs font-bold text-zinc-400">
            Cada lección es un juego del camino. Gestiona aquí la lección, sus palabras y su XP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating((c) => !c);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 dark:shadow-green-950"
        >
          <PlusIcon className="h-4 w-4" /> Nueva lección
        </button>
      </div>

      {creating || editing ? (
        <GameForm
          key={editing?.id ?? "new"}
          initial={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  category: editing.category,
                  description: editing.description ?? "",
                  emoji: editing.emoji,
                  xpReward: editing.lessonXp ?? 25,
                }
              : null
          }
          onDone={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      ) : null}

      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center dark:border-emerald-800">
          <p className="text-sm font-bold text-zinc-400">
            Aún no hay lecciones creadas. Crea la primera para empezar a configurar sus palabras.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const meta = categoryMeta(game.category);
            return (
              <div
                key={game.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${game.color}22`, color: game.color }}
                >
                  {game.emoji || meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-black text-emerald-950 dark:text-white">
                    {game.name}
                    {!game.active ? (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Inactivo
                      </span>
                    ) : (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                        style={{ backgroundColor: `${game.color}22`, color: game.color }}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-bold text-zinc-400">
                    {game.wordCount} {game.wordCount === 1 ? "palabra" : "palabras"} · {game.description ?? "Sin descripción"} ·{" "}
                    {game.lessonXp != null ? <>XP por lección: <strong className="text-emerald-600 dark:text-emerald-300">{game.lessonXp}</strong> · </> : null}
                    <span className="font-mono">{game.slug}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/settings/lecciones/juegos/${game.slug}`}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-green-600"
                  >
                    Configurar palabras
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setEditing(game);
                    }}
                    className="rounded-lg border-2 border-zinc-200 px-2.5 py-1.5 text-xs font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(game)}
                    className="rounded-lg border-2 border-red-200 px-2.5 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                  >
                    <span className="flex items-center gap-1">
                      <XIcon className="h-3 w-3" /> Eliminar
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <ConfirmDialog
      open={deleteConfirm.open}
      onClose={handleDeleteConfirm}
      title="Eliminar lección"
      message={`¿Eliminar la lección "${deleteConfirm.game?.name}"? Se borrarán sus ${deleteConfirm.game?.wordCount} palabras.`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="destructive"
    />
    <AlertDialog
      open={errorAlert.open}
      onClose={() => setErrorAlert({ open: false, message: "" })}
      title="Error"
      message={errorAlert.message}
    />
    </>
  );
}