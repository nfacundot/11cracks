"use client";

import Link from "next/link";
import { useState } from "react";

const DESKTOP_ITEMS = [
  {
    key: "equipos",
    label: "Mis equipos",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.6" /><path d="M12 7.6 15.7 10.3 14.3 14.7H9.7L8.3 10.3 12 7.6Z" /></svg>
    ),
  },
  {
    key: "contratos",
    label: "Contratos",
    href: "/contract",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" /></svg>
    ),
  },
  {
    key: "analitica",
    label: "Analítica",
    href: "/analytics",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
    ),
  },
  {
    key: "fichajes",
    label: "Fichajes",
    href: "/transfers",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 17l5.5-6 4 4L20 7M20 7h-4.5M20 7v4.5" /></svg>
    ),
  },
  {
    key: "calendario",
    label: "Calendario",
    href: "/schedule",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>
    ),
  },
  {
    key: "alineacion",
    label: "Alineación",
    href: "/lineup",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="7" r="2.6" /><circle cx="6" cy="15" r="2.6" /><circle cx="18" cy="15" r="2.6" /><path d="M12 9.6 7.5 13M12 9.6l4.5 3.4M7 16.5 10 20m7-3.5L14 20" /></svg>
    ),
  },
  {
    key: "ai",
    label: "AI Analysis",
    href: "/analysis",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.8" /><path d="M12 3.4V7m0 10v3.6M3.4 12H7m10 0h3.6" strokeLinecap="round" /></svg>
    ),
  },
  {
    key: "cashin",
    label: "Cash In",
    href: "/cashin",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v18M7.5 7.2C7.5 5.4 9.5 4.5 12 4.5s4.5 1 4.5 2.8c0 3.8-9 2.2-9 6.2 0 1.9 2 3 4.5 3s4.5-1 4.5-2.8" /><circle cx="12" cy="12" r="9.2" /></svg>
    ),
  },
  {
    key: "bonus",
    label: "Upcoming bonus",
    href: "/bonus",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3.5" y="8" width="17" height="12.5" rx="2" /><path d="M3.5 12.5h17M12 8v12.5M12 8s-1-4.5-4-4.5a2 2 0 0 0 0 4.5h4Zm0 0s1-4.5 4-4.5a2 2 0 0 1 0 4.5h-4Z" /></svg>
    ),
  },
];

/* 4 elementos demo para la barra inferior responsive */
const DEMO_ITEMS = DESKTOP_ITEMS.filter((it) =>
  ["equipos", "analitica", "fichajes", "calendario"].includes(it.key),
);

/* favicon: balón GOAL50 */
function Favicon({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.4 15.9 10.2 14.4 14.8H9.6L8.1 10.2 12 7.4Z" />
    </svg>
  );
}

const MODAL_LINKS = DESKTOP_ITEMS;

/* Menú de PC: rail vertical en escritorio, barra inferior de 5 elementos con botón central modal en responsive */
export function PcRail({ active }: { active: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ---------- escritorio: rail vertical ---------- */}
      <aside className="hidden w-[76px] shrink-0 flex-col items-center gap-4 bg-[#111110] py-7 md:flex">
        <Link
          href="/pc"
          aria-label="GOAL50"
          data-tipr="GOAL50"
          className="flex size-12 items-center justify-center rounded-full bg-white text-[#111110]"
        >
          <Favicon className="size-6.5" />
        </Link>
        <nav className="mt-3 flex flex-col items-center gap-4">
          {DESKTOP_ITEMS.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={it.href}
                aria-label={it.label}
                data-tipr={it.label}
                className={`flex size-12 items-center justify-center rounded-full transition ${
                  isActive
                    ? "bg-white text-[#111110]"
                    : "bg-[#1d1d1b] text-white/55 hover:bg-[#2a2a27] hover:text-white"
                }`}
              >
                {it.icon}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ---------- responsive: barra inferior de 5 elementos ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around bg-[#111110] px-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {DEMO_ITEMS.slice(0, 2).map((it) => (
          <Link
            key={it.key}
            href={it.href}
            aria-label={it.label}
            className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 transition ${
              active === it.key ? "text-lime" : "text-white/55"
            }`}
          >
            {it.icon}
            <span className="text-[9px] font-semibold uppercase tracking-wide">{it.label}</span>
          </Link>
        ))}

        {/* botón central grande: abre el menú modal */}
        <button
          type="button"
          aria-label="Abrir menú"
          data-tip="Abrir menú"
          onClick={() => setOpen(true)}
          className="-mt-7 flex size-16 items-center justify-center rounded-full bg-lime text-black shadow-[0_10px_30px_rgba(198,242,50,0.45)] ring-4 ring-[#111110] transition hover:brightness-110"
        >
          <Favicon className="size-9" />
        </button>

        {DEMO_ITEMS.slice(2).map((it) => (
          <Link
            key={it.key}
            href={it.href}
            aria-label={it.label}
            className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 transition ${
              active === it.key ? "text-lime" : "text-white/55"
            }`}
          >
            {it.icon}
            <span className="text-[9px] font-semibold uppercase tracking-wide">{it.label}</span>
          </Link>
        ))}
      </nav>

      {/* ---------- menú modal ---------- */}
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center p-6 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative w-full max-w-[340px] rounded-[30px] bg-[#141c10] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] ring-1 ring-lime/25 transition-all duration-300 ${
            open ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-lime text-black">
                <Favicon className="size-7" />
              </span>
              <span className="font-display text-[15px] font-bold uppercase tracking-[0.16em] text-white">
                GOAL<span className="text-lime">50</span>
              </span>
            </span>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-3">
            {MODAL_LINKS.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition ${
                  active === it.key
                    ? "bg-lime/15 text-lime ring-1 ring-lime/40"
                    : "bg-white/5 text-white/85 hover:bg-white/10"
                }`}
              >
                <span className="[&_svg]:size-4.5">{it.icon}</span>
                <span className="text-[12.5px] font-semibold">{it.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
