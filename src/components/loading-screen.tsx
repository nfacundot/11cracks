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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050606]">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-15"
        style={{
          backgroundImage: "url(/img/back/splasher1.png)",
          backgroundPosition: bgPosition,
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <img
          src="/img/emotes/11-crackslogta.svg"
          alt="11Cracks"
          className="h-17 w-auto animate-wiggle object-contain"
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#686862]">
            Cargando
          </span>
          <div className="h-0.5 w-48 overflow-hidden rounded-full bg-[#0E1111]">
            <div
              className="h-full rounded-full bg-[#C9A24A] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-[#686862]">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
