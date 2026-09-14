"use client";

import { useEffect, useRef, useState } from "react";

const GIF_URL = "/img/icons/introder.gif";
const INTRO_MS = 8000;
const INTRO_BUFFER_MS = 300;

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
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
    if (gifFailed) {
      setHidden(true);
      doneRef.current?.();
      return;
    }
    const finish = () => {
      setHidden(true);
      doneRef.current?.();
    };
    const timer = setTimeout(finish, INTRO_MS + INTRO_BUFFER_MS);
    return () => clearTimeout(timer);
  }, [isMobile, gifFailed]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      <img
        src={GIF_URL}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
        onError={() => setGifFailed(true)}
      />
    </div>
  );
}