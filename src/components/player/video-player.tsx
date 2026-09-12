"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { resolveVideoSource } from "@/lib/videos/video-source";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: { onStateChange?: (event: { data: number }) => void };
        }
      ) => { destroy: () => void };
    };
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: {
      Player: new (
        element: HTMLIFrameElement | string
      ) => { on: (event: string, handler: () => void) => void; unload: () => void };
    };
  }
}

const YOUTUBE_API_ID = "youtube-iframe-api";
const VIMEO_API_ID = "vimeo-player-api";
const API_TIMEOUT_MS = 6000;

export function VideoPlayer({
  url,
  onEnded,
  onManualReady,
}: {
  url: string | null;
  onEnded: () => void;
  onManualReady: () => void;
}) {
  const source = useMemo(() => resolveVideoSource(url), [url]);
  const containerId = useId().replace(/:/g, "");

  const onEndedRef = useRef(onEnded);
  const onManualReadyRef = useRef(onManualReady);
  useEffect(() => {
    onEndedRef.current = onEnded;
    onManualReadyRef.current = onManualReady;
  }, [onEnded, onManualReady]);

  useEffect(() => {
    if (!source || source.kind !== "embed" || source.provider !== "youtube") return;
    const w = window;
    let player: { destroy: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attach = () => {
      if (!w.YT?.Player) return;
      player = new w.YT.Player(containerId, {
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === 0) onEndedRef.current();
          },
        },
      });
      if (timer) clearTimeout(timer);
    };

    if (w.YT?.Player) {
      attach();
    } else {
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        attach();
      };
      if (!document.getElementById(YOUTUBE_API_ID)) {
        const script = document.createElement("script");
        script.id = YOUTUBE_API_ID;
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      timer = setTimeout(() => {
        if (!player) onManualReadyRef.current();
      }, API_TIMEOUT_MS);
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        player?.destroy();
      } catch {
        // El reproductor ya no existe.
      }
    };
  }, [source, containerId]);

  useEffect(() => {
    if (!source || source.kind !== "embed" || source.provider !== "vimeo") return;
    const w = window;
    let player: { on: (event: string, handler: () => void) => void; unload: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attach = () => {
      const element = document.getElementById(containerId) as HTMLIFrameElement | null;
      if (!element || !w.Vimeo?.Player) return;
      player = new w.Vimeo.Player(element);
      player.on("ended", () => onEndedRef.current());
      if (timer) clearTimeout(timer);
    };

    if (w.Vimeo?.Player) {
      attach();
    } else {
      timer = setTimeout(() => {
        if (!player) onManualReadyRef.current();
      }, API_TIMEOUT_MS);
      const existing = document.getElementById(VIMEO_API_ID) as HTMLScriptElement | null;
      if (!existing) {
        const script = document.createElement("script");
        script.id = VIMEO_API_ID;
        script.src = "https://player.vimeo.com/api/player.js";
        script.onload = attach;
        document.head.appendChild(script);
      } else {
        attach();
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        player?.unload();
      } catch {
        // El reproductor ya no existe.
      }
    };
  }, [source, containerId]);

  if (!source) {
    return <p>Este video aún no tiene fuente disponible.</p>;
  }

  if (source.kind === "file") {
    return (
      <video
        key={source.url}
        src={source.url}
        controls
        autoPlay
        playsInline
        onEnded={onEnded}
        className="player-videos-modal__video"
      />
    );
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const embedSrc =
    source.provider === "youtube"
      ? `${source.embedUrl}?enablejsapi=1&rel=0&playsinline=1${origin ? `&origin=${encodeURIComponent(origin)}` : ""}`
      : `${source.embedUrl}?title=0&byline=0&portrait=0`;

  return (
    <iframe
      id={containerId}
      key={`${source.provider}-${source.videoId}`}
      className="player-videos-modal__video"
      src={embedSrc}
      title="Reproductor de video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}