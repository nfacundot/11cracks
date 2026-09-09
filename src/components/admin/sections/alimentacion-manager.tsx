"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAlimentacionWord,
  saveAlimentacionWord,
  toggleAlimentacionWord,
  type AlimentacionState,
} from "@/actions/alimentacion";
import { PlusIcon, XIcon, PlayIcon, CheckIcon, UploadIcon } from "@/components/icons";
import { AlertDialog, ConfirmDialog } from "@/components/shared/dialog";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white";

export type AlimentacionWordViewModel = {
  id: string;
  name: string;
  imageUrl: string;
  audioUrl: string | null;
  useTts: boolean;
  ttsVoice: "female" | "male";
  isHealthy: boolean;
  language: string;
  active: boolean;
  order: number;
};

type AlimentacionDraft = {
  id?: string;
  name: string;
  imageUrl: string;
  audioUrl: string | null;
  useTts: boolean;
  ttsVoice: "female" | "male";
  isHealthy: boolean;
  language: string;
  active: boolean;
  order: number;
};

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "nl", label: "Nederlands" },
  { code: "ru", label: "Русский" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
  { code: "sv", label: "Svenska" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
];

const SPEECH_LOCALES: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  pt: "pt-BR",
  it: "it-IT",
  de: "de-DE",
  ar: "ar-SA",
  hi: "hi-IN",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  nl: "nl-NL",
  ru: "ru-RU",
  pl: "pl-PL",
  tr: "tr-TR",
  sv: "sv-SE",
  da: "da-DK",
  fi: "fi-FI",
};

const speechLocaleFor = (language: string): string => SPEECH_LOCALES[language] ?? "es-ES";

const FEMALE_TERMS = [
  "female", "woman", "femenin", "fémin", "femenina", "femenino",
  "samantha", "victoria", "helena", "zira", "sabina", "camila", "jenny",
  "aria", "hazel", "susan", "katja", "amala", "conny", "denise", "julie",
  "elsie", "francisca", "elsa", "anna", "karen", "joanna", "sally", "amy",
  "emma", "libby", "heidi", "satu", "hedda", "tessa", "fiona", "kate",
  "gisele", "laia", "mireia", "mari", "lucia", "carmen", "sara", "laura",
  "marta", "nina", "ewa", "zofia", "nanami", "ayumi", "clara", "silvia",
];

const MALE_TERMS = [
  "male", "masculin", "varón", "hombre", "masculino",
  "david", "guy", "brian", "christopher", "raul", "pablo", "alvaro",
  "diego", "antonio", "daniel", "fabio", "henri", "paul", "stefan",
  "conrad", "holger", "james", "george", "alex", "jorge", "miguel",
  "liam", "noah", "juan", "pedro", "carlos", "luis", "javier", "sergio",
];

function pickVoice(
  locale: string,
  voice: "female" | "male",
  voices: SpeechSynthesisVoice[] = []
): SpeechSynthesisVoice | null {
  const source = voices.length > 0 ? voices : typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.getVoices() : [];
  if (source.length === 0) return null;
  const localePrefix = locale.split("-")[0].toLowerCase();
  const genderTerms = voice === "female" ? FEMALE_TERMS : MALE_TERMS;
  const matching = source.filter((v) => (v.lang || "").split("-")[0].toLowerCase() === localePrefix);
  if (matching.length === 0) return null;
  return matching.find((v) => genderTerms.some((g) => v.name.toLowerCase().includes(g))) ?? matching[0];
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir archivo");
  const data = await res.json();
  return data.url;
}

function AlimentacionForm({
  initial,
  gameId,
  onDone,
}: {
  initial: AlimentacionDraft | null;
  gameId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AlimentacionState, FormData>(
    saveAlimentacionWord,
    { success: undefined, error: undefined }
  );
  const [draft, setDraft] = useState<AlimentacionDraft>(() =>
    initial
      ? initial
      : { name: "", imageUrl: "", audioUrl: null, useTts: true, ttsVoice: "female", isHealthy: true, language: "es", active: true, order: 0 }
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const previewVoice = pickVoice(speechLocaleFor(draft.language), draft.ttsVoice, voices);

  const handlePreviewTts = () => {
    if (ttsPlaying) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      return;
    }
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = draft.name || "Ejemplo";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocaleFor(draft.language);
    const selected = pickVoice(speechLocaleFor(draft.language), draft.ttsVoice, voices);
    if (selected) utterance.voice = selected;
    utterance.onstart = () => setTtsPlaying(true);
    utterance.onend = () => setTtsPlaying(false);
    utterance.onerror = () => setTtsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const url = await uploadFile(file);
      setDraft((d) => ({ ...d, audioUrl: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingAudio(false);
    }
  };

  return (
    <form
      action={(formData) => {
        formData.set("gameId", gameId);
        formData.set("id", draft.id ?? "");
        formData.set("name", draft.name);
        formData.set("imageUrl", draft.imageUrl);
        formData.set("audioUrl", draft.audioUrl ?? "");
        formData.set("useTts", String(draft.useTts));
        formData.set("ttsVoice", draft.ttsVoice);
        formData.set("isHealthy", String(draft.isHealthy));
        formData.set("language", draft.language);
        formData.set("active", String(draft.active));
        formData.set("order", String(draft.order));
        formAction(formData);
      }}
      className="space-y-4 rounded-2xl border border-green-100 bg-white/60 p-5 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-emerald-950 dark:text-white">
          {initial ? "Editar alimento" : "Nuevo alimento"}
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
          Nombre del alimento
        </label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Ej: Manzana, Hamburguesa"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Imagen
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={draft.imageUrl}
            onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={inputCls}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              disabled={uploadingImage}
              className="sr-only"
              id="image-upload"
            />
            <button
              type="button"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={uploadingImage}
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
            >
              <UploadIcon className="h-4 w-4" /> Subir archivo
            </button>
            {uploadingImage && <span className="text-xs text-zinc-400">Subiendo...</span>}
          </label>
          <p className="mt-1 text-[11px] font-bold text-zinc-400">
            Imagen del alimento (se mostrará en el juego)
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Audio (opcional)
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={draft.audioUrl ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, audioUrl: e.target.value || null }))}
            placeholder="https://ejemplo.com/audio.mp3"
            className={inputCls}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
              disabled={uploadingAudio}
              className="sr-only"
              id="audio-upload"
            />
            <button
              type="button"
              onClick={() => document.getElementById("audio-upload")?.click()}
              disabled={uploadingAudio}
              className="flex items-center gap-1.5 rounded-xl border-2 border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
            >
              <UploadIcon className="h-4 w-4" /> Subir audio
            </button>
            {uploadingAudio && <span className="text-xs text-zinc-400">Subiendo...</span>}
          </label>
          <p className="mt-1 text-[11px] font-bold text-zinc-400">
            Audio para escuchar la pronunciación
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          TTS (síntesis de voz)
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.useTts}
              onChange={(e) => setDraft((d) => ({ ...d, useTts: e.target.checked }))}
              className="rounded border-2 border-green-400 text-green-500 focus:ring-green-400"
            />
            <span className="text-sm font-bold text-emerald-950 dark:text-white">
              Usar síntesis de voz automática si no hay audio subido
            </span>
          </label>
          {draft.useTts && (
            <div className="ml-6 flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-400">Voz:</label>
              <select
                value={draft.ttsVoice}
                onChange={(e) => setDraft((d) => ({ ...d, ttsVoice: e.target.value as "female" | "male" }))}
                className="rounded-xl border-2 border-green-100 bg-white/60 px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white"
              >
                <option value="female">👩 Voz femenina</option>
                <option value="male">👨 Voz masculina</option>
              </select>
              <button
                type="button"
                onClick={handlePreviewTts}
                disabled={!draft.name.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-50 dark:shadow-green-950"
                title={ttsPlaying ? "Detener la reproducción" : "Escuchar la pronunciación con la voz seleccionada"}
              >
                {ttsPlaying ? <XIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                {ttsPlaying ? "Detener" : "Reproducir"}
              </button>
              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                {previewVoice ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {previewVoice.name}
                  </>
                ) : (
                  "Sin voz específica para este idioma"
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Tipo
          </label>
          <select
            value={draft.isHealthy ? "healthy" : "unhealthy"}
            onChange={(e) => setDraft((d) => ({ ...d, isHealthy: e.target.value === "healthy" }))}
            className={inputCls}
          >
            <option value="healthy">✅ Saludable</option>
            <option value="unhealthy">❌ No saludable</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Idioma
          </label>
          <select
            value={draft.language}
            onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
            className={inputCls}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-400">
            Orden
          </label>
          <input
            type="number"
            value={draft.order}
            onChange={(e) => setDraft((d) => ({ ...d, order: parseInt(e.target.value) || 0 }))}
            min="0"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-emerald-950 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
            className="rounded border-2 border-green-400 text-green-500 focus:ring-green-400"
          />
          Activo
        </label>
        {state?.error ? (
          <span className="ml-auto text-sm font-black text-red-500">{state.error}</span>
        ) : null}
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
          {pending ? "Guardando..." : initial ? "Guardar cambios" : "Crear alimento"}
        </button>
      </div>
    </form>
  );
}

export function AlimentacionManager({ gameId, words }: { gameId: string; words: AlimentacionWordViewModel[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AlimentacionWordViewModel | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; word: AlimentacionWordViewModel | null }>({
    open: false,
    word: null,
  });
  const [errorAlert, setErrorAlert] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const refresh = () => router.refresh();

  const handleDelete = async (word: AlimentacionWordViewModel) => {
    setDeleteConfirm({ open: true, word });
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (!confirmed || !deleteConfirm.word) return;
    const formData = new FormData();
    formData.set("id", deleteConfirm.word.id);
    const result = await deleteAlimentacionWord(undefined, formData);
    if (result?.error) setErrorAlert({ open: true, message: result.error });
    else refresh();
  };

  const handleToggle = async (word: AlimentacionWordViewModel) => {
    const formData = new FormData();
    formData.set("id", word.id);
    const result = await toggleAlimentacionWord(undefined, formData);
    if (result?.error) setErrorAlert({ open: true, message: result.error });
    else refresh();
  };

  const playAudio = (word: AlimentacionWordViewModel) => {
    if (word.audioUrl) {
      if (audioPlaying === word.audioUrl) {
        setAudioPlaying(null);
        return;
      }
      const audio = new Audio(word.audioUrl);
      audio.onended = () => setAudioPlaying(null);
      audio.onerror = () => setAudioPlaying(null);
      setAudioPlaying(word.audioUrl);
      audio.play().catch(() => setAudioPlaying(null));
    } else if (word.useTts && "speechSynthesis" in window) {
      if (audioPlaying === `tts-${word.id}`) {
        window.speechSynthesis.cancel();
        setAudioPlaying(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(word.name);
      utterance.lang = speechLocaleFor(word.language);
      const selected = pickVoice(speechLocaleFor(word.language), word.ttsVoice);
      if (selected) utterance.voice = selected;
      utterance.onend = () => setAudioPlaying(null);
      utterance.onerror = () => setAudioPlaying(null);
      setAudioPlaying(`tts-${word.id}`);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            Alimentos <span className="text-zinc-400">({words.length})</span>
          </h3>
          <p className="text-xs font-bold text-zinc-400">
            Arrastra los alimentos a la zona correcta (saludable / no saludable)
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
          <PlusIcon className="h-4 w-4" /> Nuevo alimento
        </button>
      </div>

      {creating || editing ? (
        <AlimentacionForm
          key={editing?.id ?? "new"}
          initial={
            editing
              ? {
                  ...editing,
                  isHealthy: editing.isHealthy,
                  audioUrl: editing.audioUrl,
                  useTts: editing.useTts ?? true,
                  ttsVoice: editing.ttsVoice ?? "female",
                }
              : null
          }
          gameId={gameId}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      ) : null}

      {words.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center dark:border-emerald-800">
          <p className="text-sm font-bold text-zinc-400">
            No hay alimentos. Crea el primero para configurar el juego.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-100 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img src={word.imageUrl} alt={word.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-emerald-950 dark:text-white">{word.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      word.isHealthy
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {word.isHealthy ? "✅ Saludable" : "❌ No saludable"}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{word.language.toUpperCase()}</span>
                  {!word.active && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Inactivo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(word.audioUrl || word.useTts) && (
                  <button
                    type="button"
                    onClick={() => playAudio(word)}
                    disabled={audioPlaying === word.audioUrl || audioPlaying === `tts-${word.id}`}
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
                    title={audioPlaying === word.audioUrl || audioPlaying === `tts-${word.id}` ? "Reproduciendo..." : "Escuchar pronunciación"}
                  >
                    {audioPlaying === word.audioUrl || audioPlaying === `tts-${word.id}` ? (
                      <CheckIcon className="h-5 w-5 text-green-500 animate-pulse" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(word);
                  }}
                  className="rounded-lg border-2 border-zinc-200 px-2.5 py-1.5 text-xs font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(word)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-black transition ${
                    word.active
                      ? "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950/40"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  {word.active ? "Activo" : "Inactivo"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(word)}
                  className="rounded-lg border-2 border-red-200 px-2.5 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                >
                  <span className="flex items-center gap-1">
                    <XIcon className="h-3 w-3" /> Eliminar
                  </span>
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
      title="Eliminar alimento"
      message={`¿Eliminar el alimento "${deleteConfirm.word?.name}"?`}
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