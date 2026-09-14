"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_URL = "/splash/back/ui/programlogo.png";
const SHOW_MS = 1500;

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
    const finish = () => {
      setHidden(true);
      doneRef.current?.();
    };
    const timer = setTimeout(finish, SHOW_MS);
    return () => clearTimeout(timer);
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