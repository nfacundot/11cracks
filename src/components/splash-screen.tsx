"use client";

import { useEffect, useRef, useState } from "react";

export function SplashScreen({ onDone }: { onDone?: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const video = videoRef.current;
    if (!video) return;
    const finish = () => {
      setHidden(true);
      doneRef.current?.();
    };
    video.addEventListener("ended", finish);
    video.play().catch(() => finish());
    return () => {
      video.removeEventListener("ended", finish);
    };
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/img/icons/introanim.mp4"
        muted
        playsInline
        autoPlay
      />
    </div>
  );
}
