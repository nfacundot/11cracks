export type TtsLanguage = "en" | "pt" | "es";

// Modelos MMS (VITS) por idioma en el CDN de HuggingFace.
const TTS_MODELS: Record<TtsLanguage, string> = {
  en: "Xenova/mms-tts-eng",
  pt: "Xenova/mms-tts-por",
  es: "Xenova/mms-tts-spa",
};

export const TTS_LOCALE: Record<TtsLanguage, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
};

export function ttsLanguageFor(localeOrLanguage: string): TtsLanguage {
  const prefix = (localeOrLanguage ?? "").split("-")[0].toLowerCase();
  if (prefix === "pt") return "pt";
  if (prefix === "es") return "es";
  return "en";
}

export function ttsLanguageLabel(language: TtsLanguage): string {
  return language === "pt" ? "Portugués" : language === "es" ? "Español" : "Inglés";
}

type TtsOutput = { audio: Float32Array; sampling_rate: number };
type TtsPipeline = (text: string) => Promise<TtsOutput>;
type LoadProgress = { status?: string; file?: string; progress?: number };

type TransformersModule = {
  pipeline: (
    task: string,
    model: string,
    options?: { progress_callback?: (event: LoadProgress) => void },
  ) => Promise<unknown>;
  env: { allowLocalModels: boolean; allowRemoteModels: boolean };
};

// Se carga por CDN (script) y no se empaqueta: evita los errores del bundler con este modulo.
const TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";

async function loadTransformers(): Promise<TransformersModule> {
  const scope = window as unknown as { transformers?: TransformersModule };
  if (scope.transformers) return scope.transformers;
  // Import dinamico real desde el CDN. Se hace con new Function para que el
  // bundler (Turbopack/webpack) no lo resuelva ni lo empaquete.
  const importFromCdn = new Function("url", "return import(url);") as (url: string) => Promise<unknown>;
  const mod = (await importFromCdn(TRANSFORMERS_CDN)) as unknown as TransformersModule & {
    default?: TransformersModule;
  };
  const candidate = mod.default ?? mod;
  if (typeof candidate.pipeline === "function") return candidate;
  // Si el bundle solo fija la variable global (UMD), la usamos tambien.
  if (scope.transformers) return scope.transformers;
  throw new Error("Transformers.js no expuso su API (ni ESM ni global).");
}

const pipelineCache = new Map<TtsLanguage, Promise<TtsPipeline>>();

// Progreso compartido de descarga por idioma: la precarga y el boton lo ven igual.
type ProgressListener = (percent: number) => void;
const progressState = new Map<TtsLanguage, number>();
const progressListeners = new Map<TtsLanguage, Set<ProgressListener>>();

export function subscribeTtsProgress(language: TtsLanguage, listener: ProgressListener): () => void {
  const listeners = progressListeners.get(language) ?? new Set<ProgressListener>();
  listeners.add(listener);
  progressListeners.set(language, listeners);
  const current = progressState.get(language);
  if (current !== undefined) listener(current);
  return () => {
    listeners.delete(listener);
  };
}

async function loadPipeline(
  language: TtsLanguage,
  onProgress?: (percent: number) => void,
): Promise<TtsPipeline> {
  const cached = pipelineCache.get(language);
  if (cached) {
    onProgress?.(100);
    return cached;
  }
  const loading = (async () => {
    const { pipeline, env } = await loadTransformers();
    // Modelos y WASM siempre desde CDN (HuggingFace / jsDelivr), nunca locales.
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    const pipe = await pipeline("text-to-speech", TTS_MODELS[language], {
      progress_callback: (event: LoadProgress) => {
        const percent =
          event.status === "done" || event.status === "ready"
            ? 100
            : typeof event.progress === "number"
              ? Math.min(100, Math.max(0, Math.round(event.progress)))
              : null;
        if (percent === null) return;
        progressState.set(language, percent);
        progressListeners.get(language)?.forEach((listener) => listener(percent));
        onProgress?.(percent);
      },
    });
    return pipe as unknown as TtsPipeline;
  })();
  pipelineCache.set(language, loading);
  return loading;
}

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function stopTtsAudio(): void {
  if (!currentSource) return;
  try {
    currentSource.stop();
  } catch {
    // La fuente ya estaba detenida.
  }
  currentSource = null;
}

export async function preloadTts(language: TtsLanguage): Promise<void> {
  try {
    await loadPipeline(language);
  } catch {
    // La precarga es opcional: si falla, el fallback del navegador sigue disponible.
  }
}

export class TtsBlockedError extends Error {
  constructor() {
    super("El AudioContext esta bloqueado; hace falta un gesto del usuario.");
    this.name = "TtsBlockedError";
  }
}

export async function speakWithTransformers(
  text: string,
  language: TtsLanguage,
  handlers: { onStart?: () => void; onEnd?: () => void; onProgress?: (percent: number) => void } = {},
): Promise<void> {
  const pipe = await loadPipeline(language, handlers.onProgress);
  const output = await pipe(text);
  const raw = output.audio;
  if (!raw || raw.length === 0) throw new Error("El modelo TTS no devolvio audio.");
  const samples = new Float32Array(raw as ArrayLike<number>);
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error("AudioContext no disponible.");
  if (!audioContext) audioContext = new Ctx();
  if (audioContext.state === "suspended") await audioContext.resume();
  if (audioContext.state !== "running") throw new TtsBlockedError();
  const buffer = audioContext.createBuffer(1, samples.length, output.sampling_rate);
  buffer.copyToChannel(samples, 0);
  stopTtsAudio();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  currentSource = source;
  source.onended = () => {
    if (currentSource === source) currentSource = null;
    handlers.onEnd?.();
  };
  source.start();
  handlers.onStart?.();
}
