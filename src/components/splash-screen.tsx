"use client";

import { useEffect, useRef, useState } from "react";

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
    return () => {
      mq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const finish = () => {
      setHidden(true);
      doneRef.current?.();
    };
    const timer = setTimeout(finish, 800);
    return () => clearTimeout(timer);
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      <img
        src="/img/icons/introder.gif"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}