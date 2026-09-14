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
    const fail = () => finish();
    video.addEventListener("ended", finish);
    video.addEventListener("error", fail);
    const playPromise = video.play();
    if (playPromise) playPromise.catch(fail);
    return () => {
      video.removeEventListener("ended", finish);
      video.removeEventListener("error", fail);
    };
  }, [isMobile]);

  if (hidden || !isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ pointerEvents: "none" }}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/img/icons/introanim.mp4"
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        controls={false}
      />
    </div>
  );
}