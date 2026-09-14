"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_URL = "/splash/back/ui/programlogo.png";
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black" style={{ pointerEvents: "none" }}>
      <img
        src={SPLASH_URL}
        alt=""
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
    </div>
  );
}