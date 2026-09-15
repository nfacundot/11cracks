"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_URL = "/img/icons/icontas.png";
const MIN_SHOW_MS = 800;
const MAX_WAIT_MS = 8000;

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const startedAt = Date.now();

    const finish = () => {
      const elapsed = Date.now() - startedAt;
      // Asegura un mínimo visible sin depender del momento de carga.
      const wait = Math.max(0, MIN_SHOW_MS - elapsed);
      if (wait > 0) {
        setTimeout(finish, wait);
        return;
      }
      setHidden(true);
      doneRef.current?.();
    };

    let loaded = false;
    const img = new window.Image();
    img.onload = () => {
      loaded = true;
      finish();
    };
    img.onerror = finish;
    img.src = SPLASH_URL;

    // Respaldo por si la descarga se cuelga.
    const maxTimer = setTimeout(finish, MAX_WAIT_MS);

    return () => {
      img.onload = null;
      img.onerror = null;
      clearTimeout(maxTimer);
    };
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        pointerEvents: "none",
        background:
          "radial-gradient(52% 50% at 88% 0%, rgba(239, 240, 110, 0.55), transparent 72%), radial-gradient(46% 44% at 6% 100%, rgba(165, 210, 192, 0.6), transparent 74%), linear-gradient(135deg, rgba(245, 233, 86, 0.7) 0%, rgba(201, 218, 151, 0.75) 44%, rgba(174, 211, 193, 0.85) 100%)",
        backgroundColor: "#aed3c1",
      }}
    >
      <img
        src={SPLASH_URL}
        alt=""
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
    </div>
  );
}