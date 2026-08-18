"use client";

import { useEffect, useState } from "react";

export function LoadingScreen({ bgPosition = "37% 20%" }: { bgPosition?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (progress >= 100) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-emerald-950">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-30"
        style={{
          backgroundImage: "url(/img/back/splasher1.png)",
          backgroundPosition: bgPosition,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/icons/icontas.png"
          alt="11Cracks"
          className="h-17 w-auto animate-wiggle object-contain"
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-black text-white/80">Cargando...</span>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white/50">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
