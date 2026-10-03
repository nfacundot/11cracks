"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { LessonPlayer } from "@/components/lesson-player";
import { getLessonTarget } from "@/lib/lesson-target";

type PlayerProps = ComponentProps<typeof LessonPlayer>;

type LessonPayload = {
  game: boolean;
  lesson?: PlayerProps["lesson"];
  questions?: PlayerProps["questions"];
  gameUrl?: string;
  title?: string;
};

export default function LessonScreen() {
  const lessonId = getLessonTarget();
  const [data, setData] = useState<LessonPayload | null>(null);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    fetch(`/api/lesson/${encodeURIComponent(lessonId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: LessonPayload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [lessonId]);

  // Detecta el fin de la lección e intercepta los enlaces (no navega fuera de la ventana)
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    let done = false;
    const complete = () => {
      if (done) return;
      done = true;
      window.dispatchEvent(new CustomEvent("goal50:lesson-complete"));
    };
    const isResults = () => {
      const text = node.textContent ?? "";
      return text.includes("Volver al camino") || text.includes("Lección completada") || text.includes("Lo intentaste de nuevo");
    };
    const check = () => {
      if (isResults()) complete();
    };
    const observer = new MutationObserver(check);
    observer.observe(node, { childList: true, subtree: true, characterData: true });
    check();

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (button && (button.textContent ?? "").toLowerCase().includes("resultado")) {
        complete();
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("goal50:close-lesson")), 700);
        return;
      }
      const anchor = target?.closest("a");
      if (!anchor) return;
      event.preventDefault();
      event.stopPropagation();
      const text = (anchor.textContent ?? "").toLowerCase();
      if (text.includes("continuar") || text.includes("siguiente")) complete();
      window.dispatchEvent(new CustomEvent("goal50:close-lesson"));
    };
    node.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      node.removeEventListener("click", onClick, true);
    };
  }, [data]);

  if (error || !lessonId) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">No se pudo cargar la lección.</div>;
  }
  if (!data) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Cargando lección…</div>;
  }
  if (data.game && data.gameUrl) {
    return <iframe src={data.gameUrl} title={data.title ?? "Juego"} className="h-full w-full border-0" />;
  }
  if (!data.lesson || !data.questions) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Lección sin contenido.</div>;
  }

  return (
    <div ref={wrapRef} className="no-scrollbar h-full overflow-y-auto p-4">
      <LessonPlayer
        lesson={data.lesson}
        questions={data.questions}
        returnHref="#"
        nextHref={null}
      />
    </div>
  );
}
