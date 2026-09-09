"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLetrasCrackWord,
  saveLetrasCrackWord,
  toggleLetrasCrackWord,
  type LetrasState,
} from "@/actions/letras";
import { PlusIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/shared/dialog";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white";

const LANGUAGES = [
  { code: "en", label: "Inglés (en-US)" },
  { code: "pt", label: "Portugués (pt-BR)" },
  { code: "es", label: "Español (es-ES)" },
];

const HINT_IMAGES = [
  "/game-assets/bilinguisimo/letras/rice-v1.png",
  "/game-assets/bilinguisimo/letras/eggs-v1.png",
  "/game-assets/bilinguisimo/letras/salad-v1.png",
  "/game-assets/bilinguisimo/letras/soda-v1.png",
];

type WordDraft = {
  id?: string;
  word: string;
  meaning: string;
  imageUrl: string;
  language: string;
  letters: string;
};

function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al subir la imagen");
        return;
      }
      onChange(data.url);
    } catch {
      setError("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de la imagen"
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Subir imagen"
          className="flex h-10 w-28 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-green-200 bg-white text-xs font-bold text-zinc-400 transition hover:border-green-400 dark:border-emerald-800 dark:bg-emerald-900"
        >
          {uploading ? "..." : "Subir"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Vista previa"
          className="h-16 w-16 rounded-lg border border-green-100 object-cover dark:border-emerald-800"
        />
      ) : null}
    </div>
  );
}

function buildLettersFromWord(word: string): string {
  const base = word.toUpperCase().replace(/[^A-ZÁÉÍÓÚÃÕÇÂÊÔÀ]/g, "").split("");
  const extras = ["A", "E", "I", "O", "U", "S"].filter(
    (letter) => !base.includes(letter)
  );
  return [...base, ...extras.slice(0, 2)].join(", ");
}

function WordForm({
  initial,
  gameId,
  onDone,
}: {
  initial: WordDraft | null;
  gameId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<LetrasState, FormData>(saveLetrasCrackWord, undefined);
  const [draft, setDraft] = useState<WordDraft>(() =>
    initial
      ? initial
      : {
          word: "",
          meaning: "",
          imageUrl: "",
          language: "en",
          letters: "",
        }
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  const setWordAndLetters = (word: string) => {
    const isNew = !draft.id && !draft.letters;
    setDraft((d) => ({
      ...d,
      word,
      letters: isNew ? buildLettersFromWord(word) : d.letters,
    }));
  };

  const submit = (formData: FormData) => {
    formData.set("id", draft.id ?? "");
    formData.set("gameId", gameId);
    formData.set("word", draft.word);
    formData.set("meaning", draft.meaning);
    formData.set("imageUrl", draft.imageUrl);
    formData.set("language", draft.language);
    formData.set("letters", draft.letters);
    formAction(formData);
  };

  return (
    <form
      action={submit}
      className="space-y-4 rounded-2xl border border-green-100 bg-white/60 p-5 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-emerald-950 dark:text-white">
          {initial ? "Editar palabra" : "Nueva palabra"}
        </h3>
        {state?.success ? (
          <span className="text-sm font-black text-green-600 dark:text-green-400">{state.success}</span>
        ) : null}
        {state?.error ? (
          <span className="text-sm font-black text-red-500">{state.error}</span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Palabra a construir
          </label>
          <input
            type="text"
            value={draft.word}
            onChange={(e) => setWordAndLetters(e.target.value)}
            placeholder="Ej: salad"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Significado
          </label>
          <input
            type="text"
            value={draft.meaning}
            onChange={(e) => setDraft((d) => ({ ...d, meaning: e.target.value }))}
            placeholder="Ej: Ensalada"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Idioma de pronunciación
          </label>
          <select
            value={draft.language}
            onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
            className={inputCls}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Imagen del objeto (se muestra junto al audio)
        </label>
        <ImageField value={draft.imageUrl} onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))} />
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            Referencia rápida (imágenes del juego)
          </p>
          <div className="flex gap-1.5">
            {HINT_IMAGES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, imageUrl: src }))}
                className="overflow-hidden rounded-lg border border-green-100 transition hover:border-green-400 dark:border-emerald-800"
                title="Usar esta imagen"
              >
                <Image
                  src={src}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Letras disponibles (separadas por comas)
        </label>
        <input
          type="text"
          value={draft.letters}
          onChange={(e) => setDraft((d) => ({ ...d, letters: e.target.value }))}
          placeholder="Ej: L, S, A, O, D, A, E"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] font-bold text-zinc-400">
          Deben incluir las letras de la palabra en el idioma elegido. Se pueden agregar más para crear distracción.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
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
          {pending ? "Guardando..." : initial ? "Guardar cambios" : "Crear palabra"}
        </button>
      </div>
    </form>
  );
}

type WordViewModel = {
  id: string;
  word: string;
  meaning: string;
  imageUrl: string;
  language: string;
  active: boolean;
  letters: string[];
};

export function LetrasCrackManager({ words, gameId }: { words: WordViewModel[]; gameId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WordViewModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; word: WordViewModel | null }>({
    open: false,
    word: null,
  });

  const refresh = () => router.refresh();

  const handleToggle = async (word: WordViewModel) => {
    await toggleLetrasCrackWord(word.id, !word.active);
    refresh();
  };

  const handleDelete = (word: WordViewModel) => {
    setDeleteConfirm({ open: true, word });
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (!confirmed || !deleteConfirm.word) return;
    await deleteLetrasCrackWord(deleteConfirm.word.id);
    setEditing(null);
    refresh();
  };

  const languageLabel = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label ?? code;

  return (
    <>
      <div className="space-y-5">
      {/* Preview del juego */}
      <div className="rounded-2xl border border-green-100 bg-white/60 p-5 dark:border-emerald-800 dark:bg-emerald-950/60">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-400">
          Vista previa del juego
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 dark:bg-violet-900 dark:text-violet-300">
            🔤 Letras de Crack
          </span>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            El jugador escucha la palabra y la construye con letras.
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {words
            .filter((w) => w.active)
            .slice(0, 6)
            .map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#080909]/85 p-2"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-300">
                    🔊 {w.word}
                  </p>
                  <p className="text-[10px] font-medium text-zinc-400">
                    {w.meaning} · {w.letters.length} letras
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.imageUrl}
                  alt={w.meaning}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              </div>
            ))}
          {words.filter((w) => w.active).length === 0 ? (
            <p className="text-sm font-bold text-zinc-400">
              No hay palabras activas. Agrega palabras para que el juego funcione.
            </p>
          ) : null}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            Palabras <span className="text-zinc-400">({words.length})</span>
          </h3>
          <p className="text-xs font-bold text-zinc-400">
            Elige cuántas y cuáles palabras aparecen, el audio, la imagen y las letras.
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
          <PlusIcon className="h-4 w-4" /> Nueva palabra
        </button>
      </div>

      {(creating || editing) ? (
        <WordForm
          key={editing?.id ?? "new"}
          gameId={gameId}
          initial={
            editing
              ? {
                  id: editing.id,
                  word: editing.word,
                  meaning: editing.meaning,
                  imageUrl: editing.imageUrl,
                  language: editing.language,
                  letters: editing.letters.join(", "),
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

      {/* Lista de palabras */}
      {words.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center dark:border-emerald-800">
          <p className="text-sm font-bold text-zinc-400">
            Aún no hay palabras configuradas. Crea la primera para que el juego funcione.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-violet-100 dark:bg-violet-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={word.imageUrl}
                    alt={word.meaning}
                    className="h-12 w-12 object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-black text-emerald-950 dark:text-white">
                    {word.word}
                    {!word.active ? (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Inactiva
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Activa
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-bold text-zinc-400">
                    {word.meaning} · {languageLabel(word.language)} · letras:{" "}
                    {word.letters.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle(word)}
                  className="rounded-lg border-2 border-zinc-200 px-2.5 py-1.5 text-xs font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                >
                  {word.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(word);
                  }}
                  className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-black text-white transition hover:bg-green-600"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(word)}
                  className="rounded-lg border-2 border-red-200 px-2.5 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <ConfirmDialog
      open={deleteConfirm.open}
      onClose={handleDeleteConfirm}
      title="Eliminar palabra"
      message={`¿Eliminar "${deleteConfirm.word?.word}"?`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="destructive"
    />
    </>
  );
}