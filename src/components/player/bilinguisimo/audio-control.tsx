"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechAudioReference } from "@/lib/bilingual/game-contracts";

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
  onPlayed,
  autoPlay = false,
  onAutoPlayAttempt,
}: {
  audio: SpeechAudioReference;
  onPlayed?: () => void;
  autoPlay?: boolean;
  onAutoPlayAttempt?: () => void;
}) {
  const [state, setState] = useState<AudioState>("checking");
  const recordedAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setState(audio.audioSrc || "speechSynthesis" in window ? "ready" : "unavailable");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Ignore browser speech cleanup failures.
      }
    };
  }, [audio.audioSrc, audio.text]);

  const play = useCallback((automatic = false) => {
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
    utterance.lang = audio.language;
    utterance.rate = 0.82;
    utterance.onstart = () => { setState("playing"); onPlayed?.(); };
    utterance.onend = () => setState("ready");
    utterance.onerror = () => setState(automatic ? "blocked" : "unavailable");
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setState(automatic ? "blocked" : "unavailable");
    }
  }, [audio, onPlayed]);

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
      aria-label={state === "playing" ? "Reproduciendo palabra" : state === "blocked" ? "Toca para escuchar la palabra" : "Escuchar palabra. Puedes repetirla"}
      data-state={state}
    >
      <span><SpeakerIcon playing={state === "playing"} /></span>
      <span>{state === "checking" ? "Preparando audio" : state === "unavailable" ? "Reintentar audio" : state === "blocked" ? "Toca para escuchar" : state === "playing" ? "Escuchando…" : "Escuchar otra vez"}</span>
    </button>
  );
}
