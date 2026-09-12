// Transcripción de voz 100% en el navegador (Whisper via Transformers.js).
// Se usa como respaldo de Web Speech en navegadores que no lo soportan
// (Firefox, Safari). Sin servidor ni claves: el modelo se descarga una vez
// desde el CDN de HuggingFace y queda cacheado por el navegador.
//
// Se carga por CDN (script), igual que el TTS, y no se empaqueta con el
// bundler para evitar sus errores con este modulo.

const WHISPER_CDN = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";
const WHISPER_MODEL = "Xenova/whisper-tiny";

export class WhisperUnavailableError extends Error {
  constructor(message = "El módulo de transcripción no está disponible en este navegador.") {
    super(message);
    this.name = "WhisperUnavailableError";
  }
}

type LoadProgress = { status?: string; progress?: number };
type TransformersModule = {
  pipeline: (
    task: string,
    model: string,
    options?: { progress_callback?: (event: LoadProgress) => void },
  ) => Promise<unknown>;
  env: { allowLocalModels: boolean; allowRemoteModels: boolean };
};

async function loadTransformers(): Promise<TransformersModule> {
  if (typeof window === "undefined") throw new WhisperUnavailableError();
  const scope = window as unknown as { transformers?: TransformersModule };
  const globalTf = scope.transformers as TransformersModule | undefined;
  if (globalTf) {
    globalTf.env.allowLocalModels = false;
    globalTf.env.allowRemoteModels = true;
    return globalTf;
  }
  const importFromCdn = new Function("url", "return import(url);") as (url: string) => Promise<unknown>;
  const mod = (await importFromCdn(WHISPER_CDN)) as unknown as TransformersModule & {
    default?: TransformersModule;
  };
  const candidate = mod.default ?? mod;
  if (typeof candidate.pipeline === "function") {
    candidate.env.allowLocalModels = false;
    candidate.env.allowRemoteModels = true;
    return candidate;
  }
  const fallback = scope.transformers as TransformersModule | undefined;
  if (fallback) {
    fallback.env.allowLocalModels = false;
    fallback.env.allowRemoteModels = true;
    return fallback;
  }
  throw new WhisperUnavailableError("Transformers.js no expuso su API (ni ESM ni global).");
}

type Transcriber = (input: Float32Array, options: Record<string, unknown>) => Promise<{
  text?: string;
  score?: number;
  segments?: Array<{ score?: number }>;
  chunks?: Array<{ score?: number }>;
}>;

let transcriberPromise: Promise<Transcriber> | null = null;

export type WhisperProgress = { status?: string; file?: string; progress?: number };

const progressListeners = new Set<(event: WhisperProgress) => void>();

export function subscribeWhisperProgress(listener: (event: WhisperProgress) => void): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

function emitProgress(event: WhisperProgress) {
  progressListeners.forEach((listener) => listener(event));
}

export async function getWhisperTranscriber(): Promise<Transcriber> {
  if (transcriberPromise) return transcriberPromise;
  transcriberPromise = (async () => {
    const transformers = await loadTransformers();
    const pipe = await (transformers.pipeline as NonNullable<typeof transformers.pipeline>)(
      "automatic-speech-recognition",
      WHISPER_MODEL,
      { progress_callback: emitProgress },
    );
    return pipe as unknown as Transcriber;
  })();
  try {
    return await transcriberPromise;
  } catch (error) {
    transcriberPromise = null;
    throw error;
  }
}

export function whisperSupported(): boolean {
  return typeof window !== "undefined" && "AudioContext" in window && "decodeAudioData" in window;
}

export function canTranscribeInBrowser(): boolean {
  return (
    whisperSupported() &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined"
  );
}

function confidenceOf(result: { score?: number; segments?: Array<{ score?: number }>; chunks?: Array<{ score?: number }> }): number {
  if (typeof result.score === "number") return result.score;
  const parts = [...(result.segments ?? []), ...(result.chunks ?? [])];
  const scores = parts.map((p) => p.score).filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export type WhisperLanguage = "spanish" | "english" | "portuguese";

// Whisper (multilingue) espera el idioma por nombre, no por codigo.
const WHISPER_LANGUAGE: Record<string, WhisperLanguage> = {
  es: "spanish",
  en: "english",
  pt: "portuguese",
};

export function whisperLanguageFor(code?: string | null): WhisperLanguage {
  const prefix = (code ?? "").split("-")[0].toLowerCase();
  return WHISPER_LANGUAGE[prefix] ?? "spanish";
}

export type TranscribeOptions = { prompt?: string; language?: string };

export async function transcribeAudioBlob(blob: Blob, options: TranscribeOptions = {}): Promise<{ text: string; confidence: number }> {
  if (!whisperSupported()) throw new WhisperUnavailableError();
  const transcriber = await getWhisperTranscriber();
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  try {
    const audio = await audioCtx.decodeAudioData(arrayBuffer);
    const samples = audio.getChannelData(0);
    const runOptions: Record<string, unknown> = {
      language: whisperLanguageFor(options.language),
      task: "transcribe",
    };
    if (options.prompt) runOptions.initial_prompt = options.prompt;
    const result = await transcriber(samples, runOptions);
    return { text: String(result?.text ?? "").trim(), confidence: confidenceOf(result ?? {}) };
  } finally {
    void audioCtx.close();
  }
}