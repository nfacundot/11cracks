"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-emerald-950">
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-6xl shadow-2xl shadow-green-900/50 transition-opacity duration-500 ${
          hidden ? "opacity-0" : "opacity-100"
        }`}
      >
        ⚽
      </div>
      <h1 className="animate-pop text-3xl font-black tracking-tight text-white">
        11<span className="text-green-400">Cracks</span>
      </h1>
      <p className="text-sm text-green-100/60">Entrena tu mente futbolera</p>
    </div>
  );
}
