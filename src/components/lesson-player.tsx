"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitAnswer, finishLesson, submitSpeakingAnswer } from "@/actions/lesson";
import { CheckIcon, HeartIcon, XIcon, FlameIcon, BoltIcon, ArrowLeftIcon } from "@/components/icons";
import { EmoteMascot } from "@/components/emote-mascot";
import { transcribeAudioBlob, canTranscribeInBrowser, subscribeWhisperProgress } from "@/lib/whisper";
import { speakWithTransformers, ttsLanguageFor } from "@/lib/tts-engine";

export type PlayerQuestion = {
  id: string;
  type: string;
  prompt: string;
  explanation?: string | null;
  timeSeconds?: number | null;
  options: { id: string; text: string; imageUrl?: string | null }[];
};

export type PlayerLesson = {
  id: string;
  title: string;
  emoji: string;
  xpReward: number;
  type?: string;
  optionMode?: "TEXT" | "IMAGE" | "BOTH";
  timeSeconds?: number | null;
};

const MAX_HEARTS = 3;

function isNativeCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform() === true;
}

export function LessonPlayer({
  lesson,
  questions,
  returnHref = "/jugador/learn",
  nextHref,
  language = "es",
}: {
  lesson: PlayerLesson;
  questions: PlayerQuestion[];
  returnHref?: string;
  nextHref?: string | null;
  language?: string;
}) {
  const [phase, setPhase] = useState<"intro" | "question" | "feedback" | "results">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string | null } | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [result, setResult] = useState<{ earnedXp: number; perfect: boolean; streak: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [typedWord, setTypedWord] = useState("");
  const [forceTyped, setForceTyped] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recSecs, setRecSecs] = useState(0);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [recordStats, setRecordStats] = useState<{ secs: number; bytes: number; peak: number } | null>(null);
  const [recordedReady, setRecordedReady] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [whisperPct, setWhisperPct] = useState<number | null>(null);
  const whisperPendingRef = useRef(false);
  const lastRecordingRef = useRef<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRafRef = useRef<number>(0);
  const noisePeakRef = useRef(0);
  const recordStartRef = useRef(0);
  const capListenersRef = useRef<{ remove: () => Promise<void> }[]>([]);
  const capActiveRef = useRef(false);
  const capFinalRef = useRef("");

  const question = questions[qIndex];
  const total = questions.length;
  const isLast = qIndex === total - 1;
  const isPerfect = correctCount === total;
  const isSpeaking = lesson.type === "SPEAKING";
  const isTyping = lesson.type === "TYPING";
  const isWordMode = isSpeaking || isTyping;
  const native = isNativeCapacitor();
  const secure = typeof window !== "undefined" && window.isSecureContext !== false;
  const micMode: "native" | "record" | "none" = native
    ? "native"
    : !secure
      ? "none"
      : canTranscribeInBrowser()
        ? "record"
        : "none";
  const micBlocked = forceTyped || micMode === "none";

  // Idioma de la lección: se usa en el reconocimiento, en Whisper y en la voz
  // que pronuncia la palabra (ej. "en" para un programa de inglés: Rice).
  const speechLang = language.startsWith("en")
    ? "en-US"
    : language.startsWith("pt")
      ? "pt-BR"
      : "es";

  const lessonSeconds = useCallback(
    (qi: number) => {
      const q = questions[qi];
      if (q?.timeSeconds) return q.timeSeconds;
      if (lesson.type === "CONTRARRELOJ") return Number(lesson.timeSeconds) || 10;
      return null;
    },
    [questions, lesson]
  );

  useEffect(() => subscribeWhisperProgress((event) => {
    if (typeof event.progress === "number" && event.progress < 100) {
      setWhisperPct(Math.round(event.progress));
    }
  }), []);

  const transcribeWithTimeout = useCallback(
    async (blob: Blob, options: { prompt?: string; language?: string }) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          transcribeAudioBlob(blob, options),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("timeout")), 45000);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    []
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const submitSpoken = useCallback(
    async (transcript: string, confidence: number) => {
      if (busy || phase !== "question" || !question) return;
      clearTimer();
      setBusy(true);
      setInterim("");
      const res = await submitSpeakingAnswer({
        lessonId: lesson.id,
        questionId: question.id,
        transcript,
        confidence,
      });
      if (res.ok) {
        if (res.correct) {
          setCorrectCount((c) => c + 1);
        } else {
          setHearts((h) => h - 1);
        }
        setFeedback({
          correct: res.correct,
          explanation: res.correct
            ? `¡Muy bien! ${isTyping ? `Escribiste` : "Pronunciaste"} "${res.transcript}".`
            : `${isTyping ? "Escribiste" : "Escuché"} "${res.transcript}". La palabra correcta es "${question.prompt}".`,
        });
        setPhase("feedback");
      }
      setBusy(false);
    },
    [busy, phase, question, lesson.id, clearTimer, isTyping]
  );

  const stopBrowserRecording = useCallback(() => {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = 0;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // Ya se detuvo.
      }
    }
    recorderRef.current = null;
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // No había conexión.
      }
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        // Ya estaba cerrado.
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const startBrowserRecording = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window.MediaRecorder === "undefined"
    ) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!stream.active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      recChunksRef.current = [];
      noisePeakRef.current = 0;
      setMicLevel(0);
      setRecSecs(0);
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) {
            const off = Math.abs(v - 128) / 128;
            sum += off * off;
          }
          const rms = Math.sqrt(sum / data.length);
          const level = Math.min(100, Math.round(rms * 400));
          noisePeakRef.current = Math.max(noisePeakRef.current, level);
          setMicLevel(level);
          levelRafRef.current = requestAnimationFrame(tick);
        };
        levelRafRef.current = requestAnimationFrame(tick);
      }
      recordStartRef.current = Date.now();
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const chunks = recChunksRef.current;
        recChunksRef.current = [];
        const secs = Math.max(0, Math.round((Date.now() - recordStartRef.current) / 1000));
        setRecordStats({
          secs,
          bytes: chunks.reduce((acc, b) => acc + b.size, 0),
          peak: noisePeakRef.current,
        });
        if (chunks.length === 0) {
          if (whisperPendingRef.current) {
            whisperPendingRef.current = false;
            setListening(false);
            setMicError("No se grabó audio. Revisa el permiso del micrófono y vuelve a intentar.");
          }
          return;
        }
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        lastRecordingRef.current = blob;
        setLastAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        if (whisperPendingRef.current) {
          whisperPendingRef.current = false;
          setListening(false);
          setRecordedReady(true);
        }
      };
      rec.start(250);
      recorderRef.current = rec;
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      recTimerRef.current = setInterval(() => {
        setRecSecs((s) => s + 1);
      }, 1000);
    } catch {
      if (whisperPendingRef.current) {
        whisperPendingRef.current = false;
        setListening(false);
        setMicError("No se pudo abrir el micrófono. Revisa los permisos y vuelve a intentar, o escribe la palabra.");
      }
    }
  }, []);

  useEffect(() => {
    if (phase !== "question") return;
    const secs =
      questions[qIndex]?.timeSeconds ??
      (lesson.type === "CONTRARRELOJ" ? Number(lesson.timeSeconds) || 10 : null);
    if (!secs) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, qIndex, questions, lesson, clearTimer]);

  const timeout = secondsLeft === 0 && phase === "question" && !!lessonSeconds(qIndex);

  useEffect(() => {
    if (!timeout || busy) return;
    const t = setTimeout(() => {
      clearTimer();
      setSelectedId(null);
      setTimedOut(true);
      setFeedback({ correct: false, explanation: "¡Se acabó el tiempo!" });
      setHearts((h) => h - 1);
      setPhase("feedback");
    }, 0);
    return () => clearTimeout(t);
  }, [timeout, busy, clearTimer]);

  const pickOption = async (optionId: string) => {
    if (busy || phase !== "question" || !question) return;
    setBusy(true);
    setSelectedId(optionId);
    clearTimer();

    const res = await submitAnswer({
      lessonId: lesson.id,
      questionId: question.id,
      optionId,
    });

    if (res.ok) {
      setTimedOut(false);
      setFeedback({ correct: res.correct, explanation: res.explanation });
      if (res.correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setHearts((h) => h - 1);
      }
    }
    setBusy(false);
    setPhase("feedback");
  };

const finalizeNative = useCallback(() => {
    if (!capActiveRef.current) return;
    capActiveRef.current = false;
    setListening(false);
    const text = capFinalRef.current;
    capListenersRef.current.forEach((handle) => {
      handle.remove().catch(() => {});
    });
    capListenersRef.current = [];
    import("@capacitor-community/speech-recognition")
      .then(({ SpeechRecognition }) => SpeechRecognition.stop())
      .catch(() => {});
    if (text) {
      void submitSpoken(text, 1);
    } else {
      setMicError("No te escuché. Prueba de nuevo o escribe la palabra.");
    }
  }, [submitSpoken]);

  const releaseListening = useCallback(() => {
    if (capActiveRef.current) {
      finalizeNative();
      return;
    }
    // Al soltar dejamos de grabar: el archivo se analiza en el onstop.
    stopBrowserRecording();
  }, [finalizeNative, stopBrowserRecording]);

  const startListening = useCallback(() => {
    if (busy || phase !== "question" || !question || listening) return;
    setMicError(null);
    setInterim("");
    if (isNativeCapacitor()) {
      capFinalRef.current = "";
      capActiveRef.current = true;
      import("@capacitor-community/speech-recognition")
        .then(async ({ SpeechRecognition }) => {
          let permitted = (await SpeechRecognition.checkPermissions()).speechRecognition;
          if (permitted !== "granted") {
            permitted = (await SpeechRecognition.requestPermissions()).speechRecognition;
          }
          if (permitted !== "granted") {
            capActiveRef.current = false;
            setMicError("No tienes permiso de micrófono. Permítelo en los ajustes del celular.");
            setForceTyped(true);
            return;
          }
          const handles = await Promise.all([
            SpeechRecognition.addListener("partialResults", (data) => {
              const matches = data.matches ?? [];
              const text = (matches.length ? matches[matches.length - 1] : "").trim();
              if (!text) return;
              capFinalRef.current = text;
              setInterim(text);
            }),
            SpeechRecognition.addListener("listeningState", (data) => {
              if (data.status === "started") {
                setListening(true);
              } else {
                finalizeNative();
              }
            }),
          ]);
          if (!capActiveRef.current) {
            handles.forEach((handle) => {
              handle.remove().catch(() => {});
            });
            return;
          }
          capListenersRef.current = handles;
          await SpeechRecognition.start({ language: "es", maxResults: 5, partialResults: true });
          setListening(true);
        })
        .catch(() => {
          capActiveRef.current = false;
          capListenersRef.current.forEach((handle) => {
            handle.remove().catch(() => {});
          });
          capListenersRef.current = [];
          setListening(false);
          setMicError(
            "No se pudo abrir el micrófono. Reinstala el APK actualizado (npm run android) y permite el acceso al audio."
          );
          setForceTyped(true);
        });
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setForceTyped(true);
      setMicError("El micrófono necesita una conexión segura (HTTPS o localhost). Escribe la palabra.");
      return;
    }
    if (!canTranscribeInBrowser()) {
      setForceTyped(true);
      setMicError("Este navegador no puede grabar audio. Escribe la palabra.");
      return;
    }
    // Flujo único en el navegador: grabar el audio y analizarlo con la palabra.
    whisperPendingRef.current = true;
    lastRecordingRef.current = null;
    setRecordedReady(false);
    setRecordStats(null);
    setInterim("");
    setMicError(null);
    setListening(true);
    void startBrowserRecording();
  }, [busy, phase, question, listening, startBrowserRecording, finalizeNative]);

  const speakWord = useCallback((text: string) => {
    if (typeof window === "undefined" || !text) return;
    const ttsLanguage = ttsLanguageFor(language);
    // Motor TTS del proyecto (MMS por idioma); si falla, usa la voz del navegador.
    speakWithTransformers(text, ttsLanguage).catch(() => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    });
  }, [language, speechLang]);

  const checkTypedWord = useCallback(async () => {
    const value = typedWord.trim();
    if (!value || busy || !question) return;
    await submitSpoken(value, 1);
    setTypedWord("");
  }, [typedWord, busy, question, submitSpoken]);

  const continueToNext = useCallback(async () => {
    clearTimer();
    setSelectedId(null);
    setTimedOut(false);
    setFeedback(null);
    setSecondsLeft(null);

    if (isLast) {
      setBusy(true);
      const res = await finishLesson({
        lessonId: lesson.id,
        correctCount,
        totalCount: total,
      });
      if (res.ok) {
        setResult({ earnedXp: res.earnedXp, perfect: res.perfect, streak: res.streak });
      }
      setBusy(false);
      setPhase("results");
      return;
    }

    setSecondsLeft(lessonSeconds(qIndex + 1));
    setQIndex((i) => i + 1);
    setTypedWord("");
    setPhase("question");
  }, [clearTimer, isLast, lesson.id, correctCount, total, qIndex, lessonSeconds]);

  const resetQuiz = useCallback(() => {
    clearTimer();
    setQIndex(0);
    setSelectedId(null);
    setTimedOut(false);
    setFeedback(null);
    setCorrectCount(0);
    setHearts(MAX_HEARTS);
    setResult(null);
    setSecondsLeft(null);
    setPhase("intro");
  }, [clearTimer]);

  const analyzeRecording = useCallback(async () => {
    const blob = lastRecordingRef.current;
    if (!blob || busy || transcribing) return;
    setMicError(null);
    setTranscribing(true);
    try {
      const { text, confidence } = await transcribeWithTimeout(blob, {
        prompt: question?.prompt ?? undefined,
        language,
      });
      if (!text) {
        setMicError(
          noisePeakRef.current < 8
            ? "No se captó tu voz. Revisa el volumen del micrófono y vuelve a grabar."
            : "No se entendió tu audio. Vuelve a grabar hablando claro."
        );
        return;
      }
      await submitSpoken(text, confidence);
      setRecordedReady(false);
    } catch {
      setMicError("No se pudo analizar tu audio. Vuelve a grabar.");
    } finally {
      setTranscribing(false);
      setWhisperPct(null);
    }
  }, [busy, transcribing, question, language, submitSpoken, transcribeWithTimeout]);

  const resetRecording = useCallback(() => {
    lastRecordingRef.current = null;
    setRecordedReady(false);
    setRecordStats(null);
    setMicError(null);
  }, []);

  const progressPct = Math.round((qIndex / total) * 100);
  const timedSeconds = lesson.type === "CONTRARRELOJ" ? Number(lesson.timeSeconds) || 10 : null;

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">
          {lesson.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-black">{lesson.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isSpeaking
              ? `${total} palabras para pronunciar · ${lesson.xpReward} XP · mantén presionado para hablar`
              : isTyping
                ? `${total} palabras para escribir · ${lesson.xpReward} XP · 3 corazones`
                : `${total} preguntas · ${lesson.xpReward} XP · 3 corazones`}
            {timedSeconds ? ` · ⏱ ${timedSeconds}s por pregunta` : ""}
            {lesson.optionMode === "IMAGE"
              ? " · 🖼️ opciones por imagen"
              : lesson.optionMode === "BOTH"
                ? " · 🖼️ texto e imagen"
                : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setSecondsLeft(lessonSeconds(0));
            setPhase("question");
          }}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          Comenzar
        </button>
      </div>
    );
  }

  if (phase === "results") {
    const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"];
    return (
      <div className="relative flex flex-col items-center gap-6 overflow-hidden pt-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 100) / 24}%`,
                backgroundColor: colors[i % colors.length],
                animationDuration: `${2 + (i % 4) * 0.6}s`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="animate-pop mt-8 text-6xl">{isPerfect ? "🏆" : hearts === 0 ? "💪" : "⚽"}</div>
        <div>
          <h1 className="text-2xl font-black">
            {hearts === 0 && !isPerfect ? "¡Lo intentaste de nuevo!" : "¡Lección completada!"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {isSpeaking
              ? `Pronunciaste bien ${correctCount} de ${total} palabras`
              : `Acertaste ${correctCount} de ${total} preguntas`}
          </p>
        </div>

        {result && (
          <div className="flex w-full gap-3">
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
              <div className="flex items-center gap-1 text-orange-500">
                <FlameIcon className="h-5 w-5" />
                <span className="text-2xl font-black">{result.streak}</span>
              </div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Racha</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <BoltIcon className="h-5 w-5" />
                <span className="text-2xl font-black">+{result.earnedXp}</span>
              </div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP ganado</span>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          {hearts === 0 && !isPerfect ? (
            <button
              onClick={resetQuiz}
              className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
            >
              Intentar de nuevo
            </button>
          ) : (
            <Link
              href={nextHref ?? returnHref}
              className="w-full rounded-2xl bg-green-500 py-4 text-center text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
            >
              {nextHref ? "Siguiente lección" : "Continuar"}
            </Link>
          )}
          <Link
            href={returnHref}
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Volver al camino
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isFeedback = phase === "feedback";
  const showCorrect = feedback?.correct;
  const failed = hearts === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={returnHref}
          className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Salir"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <HeartIcon
              key={i}
              className={`h-5 w-5 ${i < hearts ? "text-red-500" : "text-zinc-200 dark:text-zinc-700"}`}
            />
          ))}
        </div>
      </div>

      {lessonSeconds(qIndex) && (
        <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <span>Tiempo</span>
          <div className="flex items-center gap-1">
            <BoltIcon className="h-4 w-4 text-amber-500" />
            {secondsLeft}s
          </div>
        </div>
      )}

      <div key={qIndex + (isWordMode ? "-word" : "")} className="animate-pop flex flex-col gap-4">
        <EmoteMascot
          state={!isFeedback ? "question" : timedOut ? "timeout" : showCorrect ? "correct" : "wrong"}
          text={
            !isFeedback ? (
              isTyping ? (
                "🔊 Escucha y escribe la palabra"
              ) : isSpeaking ? (
                <span className="text-3xl">{question.prompt}</span>
              ) : (
                question.prompt
              )
            ) : timedOut ? (
              "¡Se acabó el tiempo! ⏱️"
            ) : isTyping ? (
              <span className="text-3xl">{question.prompt}</span>
            ) : showCorrect ? (
              isSpeaking ? "¡Pronunciación perfecta! 🎤" : "¡Correcto! ✅"
            ) : (
              "¡Incorrecto! ❌"
            )
          }
          explanation={isFeedback ? feedback?.explanation : undefined}
        >
          {!isWordMode &&
            question.options.map((option, i) => {
              let style =
                "bg-white text-zinc-700 hover:bg-green-50 hover:border-green-300 dark:bg-emerald-900 dark:text-zinc-100 dark:hover:bg-green-950/50 dark:hover:border-green-600";
              if (isFeedback && showCorrect && option.id === selectedId) {
                style = "bg-green-500 text-white border-green-500";
              } else if (isFeedback && !showCorrect && option.id === selectedId) {
                style = "bg-red-500 text-white border-red-500 animate-shake";
              } else if (isFeedback) {
                style = "bg-white/50 text-zinc-400 border-zinc-200 dark:bg-emerald-900/50 dark:text-zinc-500 dark:border-zinc-700";
              }

              const mode = lesson.optionMode ?? "TEXT";
              const hasImage = !!option.imageUrl;
              const showImage = hasImage && mode !== "TEXT";
              const showText =
                mode === "TEXT" || mode === "BOTH" || (mode === "IMAGE" && !hasImage);

              return (
                <button
                  key={option.id}
                  disabled={isFeedback}
                  onClick={() => pickOption(option.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 border-zinc-200 px-4 py-3.5 text-left font-semibold transition active:scale-95 dark:border-zinc-700 ${style}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    {["A", "B", "C", "D"][i] ?? i + 1}
                  </span>
                  <span className="flex flex-1 items-center gap-3">
                    {showImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.imageUrl ?? ""}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    {showText && <span className="flex-1">{option.text}</span>}
                  </span>
                  {isFeedback && showCorrect && option.id === selectedId && (
                    <CheckIcon className="h-5 w-5" />
                  )}
                  {isFeedback && !showCorrect && option.id === selectedId && (
                    <XIcon className="h-5 w-5" />
                  )}
                </button>
              );
            })}
        </EmoteMascot>

        {isTyping && !isFeedback && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-emerald-900">
            <div className="flex items-center justify-between gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              <span>Escribe lo que escuchas</span>
              <button
                type="button"
                onClick={() => speakWord(question.prompt)}
                className="rounded-xl border-2 border-zinc-200 px-3 py-1.5 font-black text-zinc-600 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
              >
                🔊 Escuchar
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void checkTypedWord();
                }}
                placeholder="Escribe la palabra…"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-green-400 dark:border-zinc-700 dark:bg-emerald-950 dark:text-white"
              />
              <button
                type="button"
                disabled={busy || !typedWord.trim()}
                onClick={() => void checkTypedWord()}
                className="shrink-0 rounded-xl bg-green-500 px-4 text-sm font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
              >
                Comprobar
              </button>
            </div>

            <p className="text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              Pulsa 🔊 para escuchar, escribe la palabra y comprueba. Tienes 3 corazones.
            </p>
          </div>
        )}

        {isSpeaking && !isFeedback && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-emerald-900">
            <div className="flex items-center justify-between gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              <span>Repite la palabra</span>
              <button
                type="button"
                onClick={() => speakWord(question.prompt)}
                className="rounded-xl border-2 border-zinc-200 px-3 py-1.5 font-black text-zinc-600 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:text-zinc-300"
              >
                🔊 Escuchar
              </button>
            </div>

            {micBlocked ? (
              <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {micError ?? "Este navegador no puede grabar audio."}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {recordedReady && !listening ? (
                  <button
                    type="button"
                    onClick={() => void analyzeRecording()}
                    disabled={busy || transcribing}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-md shadow-black/30 transition hover:bg-green-600 active:translate-y-1 disabled:opacity-50"
                  >
                    {transcribing ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                        Analizando…
                      </>
                    ) : (
                      "Siguiente"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => (listening ? releaseListening() : startListening())}
                    disabled={busy || transcribing}
                    className={`touch-none select-none flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black text-white transition-colors duration-150 disabled:opacity-50 ${
                      listening
                        ? "translate-y-1 bg-red-600 shadow-inner shadow-black/40"
                        : "bg-green-500 shadow-md shadow-black/30 hover:bg-green-600 active:translate-y-1 active:bg-green-700 active:shadow-inner active:shadow-black/40"
                    }`}
                  >
                    {listening ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-white" />
                        {micMode === "native"
                          ? "🎙️ Detener"
                          : `⏹ Detener ${Math.floor(recSecs / 60)}:${String(recSecs % 60).padStart(2, "0")}`}
                      </>
                    ) : micMode === "native" ? (
                      "🎤 Grabar"
                    ) : (
                      "🎤 Grabar"
                    )}
                  </button>
                )}

                {recordedReady && !listening && !transcribing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetRecording();
                      startListening();
                    }}
                    className="self-center rounded-xl px-3 py-1 text-sm font-black text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    ↺ Volver a grabar
                  </button>
                )}

                {micMode === "record" && !listening && !transcribing && !recordedReady && (
                  <p className="text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                    Primera vez: se descarga el analizador de voz (~40 MB) y luego queda guardado.
                  </p>
                )}
                {listening && micMode !== "native" && (
                  <div className="mx-auto flex h-10 w-full max-w-[200px] items-center justify-center gap-[3px]">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-sm transition-colors duration-75 ${
                          micLevel > (i * 100) / 24 ? "bg-red-500" : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                        style={{ height: `${Math.max(4, Math.min(36, 4 + i * 1.4))}px` }}
                      />
                    ))}
                  </div>
                )}
                <p className="text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                  Mantén presionado, di la palabra y suelta para enviar.
                </p>
              </div>
            )}

            {micError && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {micError}
              </p>
            )}

            <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-emerald-950/40">
              <p className="mb-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                Lo que dice tu audio
              </p>
              <p className="min-h-[1.5rem] text-center text-sm font-black text-zinc-700 dark:text-zinc-100">
                {transcribing
                  ? whisperPct !== null
                    ? `Descargando el analizador de voz… ${whisperPct}%`
                    : "Analizando tu audio…"
                  : listening
                    ? interim || "Grabando… di la palabra"
                    : recordedReady
                      ? interim || "Audio listo: pulsa Siguiente para analizarlo"
                      : interim || "Pulsa grabar, di la palabra y luego Siguiente"}
              </p>
            </div>
          </div>
        )}
      </div>

      {failed && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm font-bold text-red-500">
            Te quedaste sin corazones
          </p>
          <button
            onClick={resetQuiz}
            className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Volver a empezar
          </button>
        </div>
      )}

      {isFeedback && isSpeaking && lastAudioUrl && (
        <div className="rounded-2xl border-2 border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-emerald-900">
          <p className="mb-1.5 text-center text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tu grabación
          </p>
          <audio src={lastAudioUrl} controls className="w-full">
            Tu navegador no soporta reproducir audio.
          </audio>
          {recordStats && (
            <p className="mt-1.5 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              Grabado {recordStats.secs}s · {Math.max(1, Math.round(recordStats.bytes / 1024))} KB · nivel máximo {recordStats.peak}%
            </p>
          )}
        </div>
      )}

      {isFeedback && !failed && (
        <button
          onClick={continueToNext}
          disabled={busy}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
        >
          {busy ? "..." : isLast ? "Ver resultados" : isSpeaking ? "Siguiente palabra" : "Continuar"}
        </button>
      )}
    </div>
  );
}
