"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechAudioReference } from "@/lib/bilingual/game-contracts";
import { pickVoice } from "@/lib/speech";
import { speakWithTransformers, stopTtsAudio, subscribeTtsProgress, ttsLanguageFor, ttsLanguageLabel, TTS_LOCALE, TtsBlockedError, type TtsLanguage } from "@/lib/tts-engine";

type AudioState = "checking" | "ready" | "playing" | "blocked" | "unavailable";

function SpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M5 11h5l6-5v16l-6-5H5z" />
      <path className="audio-wave audio-wave--one" d="M20 10c1 1 2 2 2 4s-1 3-2 4" />
      <path className="audio-wave audio-wave--two" d="M23 7c2 2 3 4 3 7s-1 5-3 7" data-playing={playing} />
    </svg>
  );
}

export function AudioControl({
  audio,
  voiceLanguage,
  onPlayed,
  autoPlay = false,
  onAutoPlayAttempt,
}: {
  audio: SpeechAudioReference;
  voiceLanguage?: TtsLanguage;
  onPlayed?: () => void;
  autoPlay?: boolean;
  onAutoPlayAttempt?: () => void;
}) {
  const [state, setState] = useState<AudioState>("checking");
  const [ttsProgress, setTtsProgress] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recordedAudio = useRef<HTMLAudioElement | null>(null);
  const language: TtsLanguage = voiceLanguage ?? ttsLanguageFor(audio.language);
  const fallbackLocale = TTS_LOCALE[language];

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  useEffect(() => subscribeTtsProgress(language, setTtsProgress), [language]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(audio.audioSrc || "speechSynthesis" in window ? "ready" : "unavailable");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      stopTtsAudio();
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Ignore browser speech cleanup failures.
      }
    };
  }, [audio.audioSrc, audio.text]);

  const play = useCallback(async (automatic = false) => {
    if (audio.audioSrc) {
      const element = recordedAudio.current ?? new Audio(audio.audioSrc);
      recordedAudio.current = element;
      element.onplay = () => { setState("playing"); onPlayed?.(); };
      element.onended = () => setState("ready");
      element.onerror = () => setState("unavailable");
      element.currentTime = 0;
      void element.play().catch(() => setState("unavailable"));
      return;
    }
    setState("checking");
    try {
      await speakWithTransformers(audio.text, language, {
        onStart: () => { setState("playing"); onPlayed?.(); },
        onEnd: () => setState("ready"),
      });
      return;
    } catch (error) {
      if (error instanceof TtsBlockedError) {
        // Sin gesto del usuario no se puede reproducir: NO usamos la voz normal,
        // mostramos "Toca para escuchar" para que al pulsar suene la voz asignada.
        setState("blocked");
        return;
      }
      // Falla real del motor (sin modelo/red): registramos la causa y caemos al navegador.
      console.error("[TTS] El motor neuronal fallo:", error);
    }
    if (!("speechSynthesis" in window)) {
      setState("unavailable");
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch {
      // A browser speech implementation may reject cancellation during startup.
    }
    const utterance = new SpeechSynthesisUtterance(audio.text);
    utterance.lang = fallbackLocale;
    const selectedVoice = pickVoice(fallbackLocale, "male", voices);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.82;
    utterance.onstart = () => { setState("playing"); onPlayed?.(); };
    utterance.onend = () => setState("ready");
    utterance.onerror = () => setState(automatic ? "blocked" : "unavailable");
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setState(automatic ? "blocked" : "unavailable");
    }
  }, [audio, fallbackLocale, language, onPlayed, voices]);

  useEffect(() => {
    if (!autoPlay || state !== "ready") return;
    onAutoPlayAttempt?.();
    const frame = window.requestAnimationFrame(() => play(true));
    return () => window.cancelAnimationFrame(frame);
  }, [autoPlay, onAutoPlayAttempt, play, state]);

  return (
    <button
      className="bilingual-audio"
      type="button"
      onClick={() => play(false)}
      disabled={state === "checking"}
      aria-label={`${state === "playing" ? "Reproduciendo palabra" : state === "blocked" ? "Toca para escuchar la palabra" : "Escuchar palabra. Puedes repetirla"}. Voz en ${ttsLanguageLabel(language)}`}
      data-state={state}
    >
      <span><SpeakerIcon playing={state === "playing"} /></span>
      <span>
        {ttsProgress !== null && ttsProgress < 100
          ? `Descargando voz ${ttsProgress}%`
          : state === "checking"
            ? "Preparando audio"
            : state === "unavailable"
              ? "Reintentar audio"
              : state === "blocked"
                ? "Toca para escuchar"
                : state === "playing"
                  ? "Escuchando…"
                  : "Escuchar otra vez"}
      </span>
      <span className="bilingual-audio__voice">Voz: {ttsLanguageLabel(language)}</span>
    </button>
  );
}
