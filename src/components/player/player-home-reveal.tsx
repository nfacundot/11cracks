"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PlayerHomeReveal({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");

    if (!("IntersectionObserver" in window) || !targets.length) {
      root.setAttribute("data-reveal-ready", "");
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) root.setAttribute("data-reveal-ready", "");
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.12 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="player-home-reveal">
      {children}
    </div>
  );
}