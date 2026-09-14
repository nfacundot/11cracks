"use client";

import { useEffect, useRef, useState } from "react";

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [decoderSupported, setDecoderSupported] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setDecoderSupported(typeof ImageDecoder !== "undefined");
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
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (cancelled) return;
      setHidden(true);
      doneRef.current?.();
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        if (cancelled) resolve();
        else setTimeout(resolve, ms);
      });

    async function playOnce(): Promise<void> {
      if (!canvasRef.current) throw new Error("no canvas");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      if (typeof ImageDecoder === "undefined") throw new Error("no decoder");

      const res = await fetch("/img/icons/introder.gif");
      if (!res.ok) throw new Error("fetch failed");
      const buffer = await res.arrayBuffer();

      const decoder = new ImageDecoder({ data: buffer, type: "image/gif" });
      await decoder.tracks.ready;
      const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
      if (frameCount <= 0) throw new Error("no frames");

      const frames: { image: VideoFrame; durationUs: number }[] = [];
      for (let i = 0; i < frameCount; i++) {
        const { image } = await decoder.decode({ frameIndex: i });
        const durationUs = image.duration || 0;
        if (durationUs <= 0) throw new Error("frame duration missing");
        frames.push({ image, durationUs });
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
    }

    if (decoderSupported) {
      playOnce()
        .then(finish)
        .catch(() => {
          if (cancelled) return;
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(finish, 3000);
        });
    } else {
      timeout = setTimeout(finish, 3000);
    }

    const safety = setTimeout(finish, 8000);

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      clearTimeout(safety);
    };
  }, [isMobile, decoderSupported]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      {decoderSupported ? (
        <canvas ref={canvasRef} className="h-full w-full" />
      ) : (
        <img
          src="/img/icons/introder.gif"
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
}