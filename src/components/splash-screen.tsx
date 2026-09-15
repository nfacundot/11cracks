"use client";

import { useEffect, useRef, useState } from "react";

const LIGHT_ICON_URL = "/img/emotes/11-crackslogta.svg";
const DARK_ICON_URL = "/img/icons/icontas.png";
const MIN_SHOW_MS = 800;
const MAX_WAIT_MS = 8000;

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
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
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsDark(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const startedAt = Date.now();
    const iconUrl = isDark ? DARK_ICON_URL : LIGHT_ICON_URL;

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
    img.src = iconUrl;

    // Respaldo por si la descarga se cuelga.
    const maxTimer = setTimeout(finish, MAX_WAIT_MS);

    return () => {
      img.onload = null;
      img.onerror = null;
      clearTimeout(maxTimer);
    };
  }, [isMobile, isDark]);

  if (hidden || !isMobile) return null;

  const lightBackground =
    "radial-gradient(52% 50% at 88% 0%, rgba(212, 174, 111, 0.28), transparent 72%), radial-gradient(46% 44% at 6% 100%, rgba(165, 210, 192, 0.32), transparent 74%), linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.22) 45%, rgba(255, 255, 255, 0.36) 100%)";
  const darkBackground =
    "radial-gradient(52% 50% at 88% 0%, rgba(212, 174, 111, 0.16), transparent 72%), radial-gradient(46% 44% at 6% 100%, rgba(80, 120, 150, 0.18), transparent 74%), linear-gradient(160deg, rgba(16, 22, 19, 0.62) 0%, rgba(26, 34, 30, 0.58) 100%)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        pointerEvents: "none",
        background: isDark ? darkBackground : lightBackground,
        backgroundColor: isDark ? "#141a17" : "#f3f6ef",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: "min(72vw, 560px)",
          padding: "clamp(2rem, 8vw, 4rem)",
          borderRadius: "28px",
          background: isDark
            ? "rgba(20, 26, 23, 0.35)"
            : "rgba(255, 255, 255, 0.35)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
            : "0 8px 32px rgba(90, 110, 100, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <img
          key={isDark ? DARK_ICON_URL : LIGHT_ICON_URL}
          src={isDark ? DARK_ICON_URL : LIGHT_ICON_URL}
          alt=""
          className="max-h-full max-w-full select-none"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: isDark
              ? "none"
              : "drop-shadow(0 2px 10px rgba(16, 22, 19, 0.12))",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}