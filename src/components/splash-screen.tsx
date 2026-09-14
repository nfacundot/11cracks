"use client";

import { useEffect, useRef, useState } from "react";

const GIF_URL = "/img/icons/introder.gif";
const FETCH_TIMEOUT_MS = 800;
const MAX_INTRO_MS = 4000;

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (cancelled) return;
      setHidden(true);
      doneRef.current?.();
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        if (cancelled) {
          clearTimeout(t);
          resolve();
        }
      });

    async function playOnce(): Promise<void> {
      if (!canvasRef.current) throw new Error("no canvas");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      if (typeof ImageDecoder === "undefined") throw new Error("no decoder");

      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(GIF_URL, { signal: controller.signal, cache: "force-cache" });
      clearTimeout(fetchTimer);
      if (!res.ok) throw new Error("fetch failed");
      const buffer = await res.arrayBuffer();

      const decoder = new ImageDecoder({ data: buffer, type: "image/gif" });
      await decoder.tracks.ready;
      const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
      if (frameCount <= 0) throw new Error("no frames");

      const frames: { image: VideoFrame; durationUs: number }[] = [];
      let totalMs = 0;
      for (let i = 0; i < frameCount; i++) {
        if (cancelled) return;
        const { image } = await decoder.decode({ frameIndex: i });
        const durationUs = image.duration || 0;
        if (durationUs <= 0) throw new Error("frame duration missing");
        frames.push({ image, durationUs });
        totalMs += durationUs / 1000;
      }
      decoder.close();

      const cw = canvas.clientWidth || window.innerWidth;
      const ch = canvas.clientHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.scale(dpr, dpr);

      const first = frames[0].image;
      const fw = first.displayWidth;
      const fh = first.displayHeight;
      if (!fw || !fh) throw new Error("bad frame size");

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);

      for (const frame of frames) {
        if (cancelled) return;
        const scale = Math.max(cw / fw, ch / fh);
        const dw = fw * scale;
        const dh = fh * scale;
        ctx.drawImage(frame.image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        frame.image.close();
        await sleep(frame.durationUs / 1000);
      }
      void totalMs;
    }

    if (typeof ImageDecoder !== "undefined") {
      playOnce()
        .then(finish)
        .catch(() => {
          if (cancelled) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(finish, 400);
        });
    } else {
      timer = setTimeout(finish, 400);
    }

    timer = setTimeout(finish, MAX_INTRO_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}