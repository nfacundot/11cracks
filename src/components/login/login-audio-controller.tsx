"use client";

import { useEffect } from "react";
import { preloadLoginAudio, startLoginAmbient, unlockLoginAudio } from "@/lib/audio/audio-manager";

export function LoginAudioController() {
  useEffect(() => {
    preloadLoginAudio();
    startLoginAmbient();
    let unlocked = false;

    const handleGesture = () => {
      if (unlocked) return;
      unlocked = true;
      unlockLoginAudio();
      document.removeEventListener("pointerdown", handleGesture, true);
      document.removeEventListener("touchstart", handleGesture, true);
      document.removeEventListener("keydown", handleGesture, true);
    };

    document.addEventListener("pointerdown", handleGesture, true);
    document.addEventListener("touchstart", handleGesture, true);
    document.addEventListener("keydown", handleGesture, true);
    return () => {
      document.removeEventListener("pointerdown", handleGesture, true);
      document.removeEventListener("touchstart", handleGesture, true);
      document.removeEventListener("keydown", handleGesture, true);
    };
  }, []);

  return null;
}
