"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function LessonLoader() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1100;
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
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-black/85 backdrop-blur-xl"
    >
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          className="animate-spin absolute inset-0 rounded-full border-4 border-emerald-900 border-t-green-400"
          style={{ animationDuration: "0.9s" }}
        />
        <span className="absolute inset-1.5 rounded-full bg-white/5" />
        <Image
          src="/img/icons/faviconlit.png"
          alt=""
          width={88}
          height={88}
          priority
          className="animate-pop relative h-20 w-20 rounded-full"
        />
      </div>
      <p className="animate-pop text-lg font-black tracking-tight text-white">
        Cargando lección…
      </p>
      <div className="animate-pop w-48">
        <div className="mb-1.5 text-center text-sm font-black tabular-nums text-green-400">
          {pct}%
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function LessonLoaderGlobal() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="/jugador/lesson/"]');
      if (!link) return;
      setLoading(true);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    const changed = pathname !== prevPathRef.current;
    prevPathRef.current = pathname;
    if (loading && changed) {
      const t = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(t);
    }
  }, [loading, pathname]);

  return loading ? <LessonLoader /> : null;
}
