"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { markVideoCompletedAction, completeVideoQuizAction } from "@/app/actions/videos";
import type { PlayerVideoView } from "@/lib/videos/service";
import { VideoPlayer } from "@/components/player/video-player";

type Filter = "PARA_MI" | "ENTRENAMIENTO" | "NEUROCRACKS" | "COMPLETADOS";

const CATEGORY_LABEL: Record<string, string> = {
  PARA_MI: "PARA MÍ",
  ENTRENAMIENTO: "ENTRENAMIENTO",
  NEUROCRACKS: "NEUROCRACKS",
};

export function PlayerVideos({
  videos,
  initialFilter,
}: {
  videos: PlayerVideoView[];
  initialFilter?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<Filter>(() => {
    const value = initialFilter?.toLowerCase();
    if (value === "training") return "ENTRENAMIENTO";
    if (value === "completed" || value === "completados") return "COMPLETADOS";
    if (value === "para_mi" || value === "para-mi" || value === "para mí") return "PARA_MI";
    return "PARA_MI";
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [manualReady, setManualReady] = useState(false);
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<{ total: number; correct: number } | null>(null);

  const completedCount = videos.filter((v) => v.completed || justCompleted.has(v.id)).length;

  const filtered = useMemo(() => {
    if (activeFilter === "PARA_MI") {
      return videos.filter((v) => v.category === "PARA_MI" && !(v.completed || justCompleted.has(v.id)));
    }
    if (activeFilter === "COMPLETADOS") {
      return videos.filter((v) => v.completed || justCompleted.has(v.id));
    }
    return videos.filter((v) => v.category === activeFilter);
  }, [videos, activeFilter, justCompleted]);

  const playing = playingId ? videos.find((v) => v.id === playingId) ?? null : null;
  const playingCompleted = playing ? playing.completed || justCompleted.has(playing.id) : false;
  const quizQuestions = playing?.quiz ?? [];
  const allQuizAnswered = quizQuestions.length > 0 && quizQuestions.every((q) => quizAnswers[q.id]);

  function markComplete(videoId: string) {
    const formData = new FormData();
    formData.set("videoId", videoId);
    startTransition(async () => {
      try {
        await markVideoCompletedAction(formData);
        setJustCompleted((prev) => new Set(prev).add(videoId));
        router.refresh();
      } catch {
        // El jugador puede reintentar desde el reproductor.
      }
    });
  }

  function open(videoId: string) {
    setVideoEnded(false);
    setManualReady(false);
    setPlayingId(videoId);
    setQuizAnswers({});
    setQuizFeedback(null);
  }

  const handleEnded = useCallback(() => setVideoEnded(true), []);
  const handleManualReady = useCallback(() => setManualReady(true), []);

  return (
    <article className="player-videos-page">
      <header className="player-videos-page__header">
        <div>
          <span className="player-videos-page__eyebrow">DESARROLLO · VIDEO</span>
          <h1>Videos</h1>
          <p>Contenido aprobado para entrenar, aprender y retomar tu recorrido a tu ritmo.</p>
        </div>
        <div className="player-videos-page__summary">
          <strong>{completedCount}</strong>
          <span>completados</span>
        </div>
      </header>

      {playing
        ? createPortal(
            <div className="player-videos-modal">
              <div className="player-videos-modal__backdrop" />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Reproductor: ${playing.title}`}
                className="player-videos-modal__panel"
              >
                <div className="player-videos-modal__head">
                  <div>
                    <span className="player-videos-player-badge">
                      {CATEGORY_LABEL[playing.category] ?? playing.category}
                    </span>
                    <h2>{playing.title}</h2>
                  </div>
                  <button
                    type="button"
                    className="player-videos-modal__close"
                    onClick={() => setPlayingId(null)}
                    aria-label="Cerrar"
                  >
                    CERRAR ✕
                  </button>
                </div>
                {playing.description ? <p className="player-videos-modal__desc">{playing.description}</p> : null}
                <VideoPlayer url={playing.url} onEnded={handleEnded} onManualReady={handleManualReady} />
                {!playingCompleted && quizQuestions.length > 0 && (videoEnded || manualReady) ? (
                  <div className="player-videos-modal__quiz">
                    <h3 className="player-videos-modal__quiz-title">Cuestionario del video</h3>
                    <p className="player-videos-modal__quiz-sub">
                      Responde todas las preguntas sobre el video y luego marca Completar Video.
                    </p>
                    {quizQuestions.map((q, qi) => (
                      <div className="player-videos-modal__quiz-question" key={q.id}>
                        <p className="player-videos-modal__quiz-prompt">
                          {qi + 1}. {q.prompt}
                        </p>
                        <div className="player-videos-modal__quiz-options">
                          {q.options.map((option) => (
                            <label
                              className="player-videos-modal__quiz-option"
                              key={option.id}
                              data-checked={quizAnswers[q.id] === option.id}
                            >
                              <input
                                type="radio"
                                name={`videoQuizQ${qi}`}
                                checked={quizAnswers[q.id] === option.id}
                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: option.id }))}
                              />
                              <span>{option.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {quizFeedback ? (
                  <p className="player-videos-modal__hint">
                    Resultado del cuestionario: {quizFeedback.correct} de {quizFeedback.total} correctas ✓
                  </p>
                ) : null}
                <div className="player-videos-modal__actions">
                  <button
                    type="button"
                    className="player-videos-modal__complete"
                    disabled={
                      isPending ||
                      (!videoEnded && !manualReady && !playingCompleted) ||
                      (quizQuestions.length > 0 && !allQuizAnswered && !playingCompleted)
                    }
                    onClick={() => {
                      if (playingCompleted) return;
                      if (quizQuestions.length > 0) {
                        const answers = Object.entries(quizAnswers).map(([questionId, optionId]) => ({ questionId, optionId }));
                        const formData = new FormData();
                        formData.set("videoId", playing.id);
                        formData.set("answers", JSON.stringify(answers));
                        startTransition(async () => {
                          try {
                            const result = await completeVideoQuizAction(formData);
                            setJustCompleted((prev) => new Set(prev).add(playing.id));
                            setQuizFeedback(result);
                            router.refresh();
                          } catch {
                            // El jugador puede reintentar desde el reproductor.
                          }
                        });
                      } else {
                        markComplete(playing.id);
                        setPlayingId(null);
                      }
                    }}
                  >
                    {playingCompleted ? "Completado ✓" : isPending ? "Guardando…" : "Completar Video"}
                  </button>
                </div>
                {!videoEnded && manualReady && !playingCompleted ? (
                    <p className="player-videos-modal__hint">
                      Cuando termines de ver el video, márcalo como completado con el botón.
                    </p>
                  ) : null}
                  {!videoEnded && !manualReady && !playingCompleted ? (
                    <p className="player-videos-modal__hint">
                      Termina de ver el video para activar el botón &ldquo;Completar Video&rdquo;.
                    </p>
                  ) : null}
              </div>
            </div>,
            document.body
          )
        : null}

      <div className="player-videos-page__filters" role="tablist" aria-label="Filtros de videos">
        {(["PARA_MI", "ENTRENAMIENTO", "NEUROCRACKS", "COMPLETADOS"] as Filter[]).map((filter) => (
          <button
            key={filter}
            role="tab"
            aria-selected={activeFilter === filter}
            className="player-videos-page__filter"
            data-active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {CATEGORY_LABEL[filter] ?? filter}
          </button>
        ))}
      </div>

      <div className="player-videos-page__grid">
        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            {activeFilter === "PARA_MI"
              ? "No tienes videos PARA MÍ pendientes por ver."
              : activeFilter === "COMPLETADOS"
                ? "Aún no has completado videos."
                : "No hay videos en esta categoría todavía."}
          </p>
        ) : null}
        {filtered.map((v) => {
          const completed = v.completed || justCompleted.has(v.id);
          return (
            <article className="player-videos-page__card" key={v.id} data-status={completed ? "completed" : "new"}>
              <div className="player-videos-page__thumb">
                <span aria-hidden="true">{completed ? "✓" : "▶"}</span>
              </div>
              <div className="player-videos-page__card-body">
                <div className="player-videos-page__card-meta">
                  <span>{CATEGORY_LABEL[v.category] ?? v.category}</span>
                  {completed ? <span>Completado</span> : null}
                </div>
                <h3>{v.title}</h3>
                {v.description ? <p>{v.description}</p> : null}
                <div className="player-videos-page__card-facts">
                  <span>{completed ? "100% completado" : "0% completado"}</span>
                </div>
                <button
                  type="button"
                  className="player-videos-page__card-cta"
                  disabled={isPending}
                  onClick={() => (completed ? null : open(v.id))}
                >
                  {completed ? "COMPLETADO" : "EMPEZAR"} <span aria-hidden="true">{completed ? "✓" : "→"}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}