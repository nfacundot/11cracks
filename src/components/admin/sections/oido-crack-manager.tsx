"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOidoWord,
  saveOidoWord,
  toggleOidoWord,
  type OidoState,
} from "@/actions/oido";
import { PlusIcon, XIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/shared/dialog";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white";

const LANGUAGES = [
  { code: "en", label: "Inglés (en-US)" },
  { code: "pt", label: "Portugués (pt-BR)" },
  { code: "es", label: "Español (es-ES)" },
];

type OptionDraft = { id?: string; label: string; imageUrl: string; isCorrect: boolean };
type WordDraft = {
  id?: string;
  word: string;
  label: string;
  language: string;
  options: OptionDraft[];
};

const emptyOption = (): OptionDraft => ({ label: "", imageUrl: "", isCorrect: false });

const HINT_IMAGES = [
  "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png",
  "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png",
  "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png",
  "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png",
];

function OptionImageField({
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

function WordForm({
  initial,
  gameId,
  onDone,
}: {
  initial: WordDraft | null;
  gameId: string;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<OidoState, FormData>(saveOidoWord, undefined);
  const [draft, setDraft] = useState<WordDraft>(() =>
    initial
      ? {
          id: initial.id,
          word: initial.word,
          label: initial.label ?? "",
          language: initial.language,
          options: initial.options.map((o) => ({
            id: o.id,
            label: o.label,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
          })),
        }
      : {
          word: "",
          label: "",
          language: "en",
          options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
        }
  );

  useEffect(() => {
    if (state?.success) {
      onDone();
    }
  }, [state, onDone]);

  const setOption = (index: number, patch: Partial<OptionDraft>) => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }));
  };

  const setOneCorrect = (index: number) => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o, i) => ({ ...o, isCorrect: i === index })),
    }));
  };

  const updateOptionArray = (list: OptionDraft[]) =>
    setDraft((d) => ({ ...d, options: list }));

  const addOption = () => updateOptionArray([...draft.options, emptyOption()]);

  const submit = (formData: FormData) => {
    formData.set("id", draft.id ?? "");
    formData.set("gameId", gameId);
    formData.set("word", draft.word);
    formData.set("label", draft.label);
    formData.set("language", draft.language);
    formData.set("options", JSON.stringify(draft.options));
    formAction(formData);
  };

  return (
    <form
      ref={inputRef}
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
            Palabra a pronunciar
          </label>
          <input
            type="text"
            value={draft.word}
            onChange={(e) => setDraft((d) => ({ ...d, word: e.target.value }))}
            placeholder="Ej: jersey"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Significado / etiqueta
          </label>
          <input
            type="text"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Ej: Camiseta"
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-zinc-500 dark:text-zinc-400">
            Opciones (el jugador elige la imagen correcta)
          </p>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-black text-white transition hover:bg-green-600"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Opción
          </button>
        </div>

        {draft.options.map((option, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-xl border border-green-100 bg-white/40 p-3 dark:border-emerald-800 dark:bg-emerald-900/40 sm:flex-row sm:items-center"
          >
            <button
              type="button"
              onClick={() => setOneCorrect(index)}
              title={option.isCorrect ? "Es la respuesta correcta" : "Marcar como correcta"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition ${
                option.isCorrect
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-zinc-300 text-transparent dark:border-zinc-600"
              }`}
            >
              ✓
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={option.label}
                onChange={(e) => setOption(index, { label: e.target.value })}
                placeholder={`Etiqueta de la opción ${index + 1} (ej: Camiseta)`}
                className={inputCls}
              />
              <div className="mt-1.5">
                <OptionImageField
                  value={option.imageUrl}
                  onChange={(url) => setOption(index, { imageUrl: url })}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateOptionArray(draft.options.filter((_, i) => i !== index))}
              disabled={draft.options.length <= 2}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-950/40"
              aria-label="Quitar opción"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
            Referencia rápida (imágenes del juego)
          </p>
          <div className="flex gap-1.5">
            {HINT_IMAGES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  const firstEmpty = draft.options.findIndex((o) => !o.imageUrl);
                  if (firstEmpty !== -1) setOption(firstEmpty, { imageUrl: src });
                }}
                className="overflow-hidden rounded-lg border border-green-100 transition hover:border-green-400 dark:border-emerald-800"
                title="Usar esta imagen (rellena la primera opción vacía)"
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
  label: string | null;
  language: string;
  active: boolean;
  options: { id: string; label: string; imageUrl: string; isCorrect: boolean; order: number }[];
};

export function OidoCrackManager({ words, gameId }: { words: WordViewModel[]; gameId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WordViewModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; word: WordViewModel | null }>({
    open: false,
    word: null,
  });

  const refresh = () => router.refresh();

  const handleToggle = async (word: WordViewModel) => {
    await toggleOidoWord(word.id, !word.active);
    refresh();
  };

  const handleDelete = (word: WordViewModel) => {
    setDeleteConfirm({ open: true, word });
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (!confirmed || !deleteConfirm.word) return;
    await deleteOidoWord(deleteConfirm.word.id);
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
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
            🎧 Oído de Crack
          </span>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            El jugador escucha la palabra y elige la imagen correcta.
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {words
            .filter((w) => w.active)
            .slice(0, 6)
            .map((w) => {
              const correct = w.options.find((o) => o.isCorrect);
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded-xl border border-white/5 tk-panel p-2"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      🔊 {w.word}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-400">{w.label}</p>
                  </div>
                  {correct ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={correct.imageUrl}
                      alt={correct.label}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : null}
                </div>
              );
            })}
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
            Elige cuántas y cuáles palabras aparecen, el audio y las imágenes.
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
                  label: editing.label ?? "",
                  language: editing.language,
                  options: editing.options.map((o) => ({
                    id: o.id,
                    label: o.label,
                    imageUrl: o.imageUrl,
                    isCorrect: o.isCorrect,
                  })),
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
          {words.map((word) => {
            const correct = word.options.find((o) => o.isCorrect);
            return (
              <div
                key={word.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cyan-100 text-2xl dark:bg-cyan-900">
                    🔊
                  </div>
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
                      {word.label ?? "Sin etiqueta"} · {languageLabel(word.language)}
                    </p>
                  </div>
                </div>

                {correct ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={correct.imageUrl}
                      alt={correct.label}
                      className="h-10 w-10 rounded-lg border border-green-100 object-cover dark:border-emerald-800"
                    />
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                      {word.options.length} opciones
                    </span>
                  </div>
                ) : null}

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
            );
          })}
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