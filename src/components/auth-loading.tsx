"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function AuthLoading({ label = "Cargando" }: { label?: string }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1800;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2);
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-white/10 bg-black/80 px-10 py-8 shadow-2xl">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            className="animate-spin absolute inset-0 rounded-full border-4 border-emerald-900 border-t-green-400"
            style={{ animationDuration: "0.9s" }}
          />
          <Image
            src="/img/icons/faviconlit.png"
            alt=""
            width={56}
            height={56}
            priority
            className="relative h-14 w-14 object-contain"
          />
        </div>
        <p className="text-lg font-black tracking-tight text-white">{label}</p>
        <p className="text-3xl font-black tabular-nums text-green-400">{pct}%</p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
