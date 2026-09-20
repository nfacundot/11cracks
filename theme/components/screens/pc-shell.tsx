"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconSearch } from "../icons";

/* ---------- tooltip ---------- */

export function Tip({
  label,
  children,
  side = "bottom",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#141c10] px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-opacity duration-150 group-hover/tip:opacity-100 ${
          side === "bottom" ? "top-[calc(100%+6px)]" : "bottom-[calc(100%+6px)]"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

/* ---------- top bar menu (replaces sidebars) ---------- */

const LINKS = [
  { key: "contract", label: "Panel", tip: "Panel · Mi equipo", href: "/pc/contract" },
  { key: "transfers", label: "Fichajes", tip: "Fichajes y salarios", href: "/pc/transfers" },
  { key: "schedule", label: "Calendario", tip: "Calendario de pagos", href: "/pc/schedule" },
  { key: "analytics", label: "Analítica", tip: "Analítica e ingresos", href: "/pc/analytics" },
  { key: "auth", label: "Cuenta", tip: "Iniciar sesión o registrarse", href: "/pc/auth" },
  { key: "mobile", label: "App móvil", tip: "Ver la versión móvil", href: "/mobile" },
] as const;

export function PcTopBar({ active }: { active: string }) {
  return (
    <header className="flex flex-wrap items-center gap-3 bg-[#141812] px-6 py-3">
      <Tip label="Inicio · GOAL50">
        <Link
          href="/pc/contract"
          className="flex size-10 items-center justify-center rounded-xl bg-lime text-black transition hover:brightness-110"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8.6" />
            <path d="M12 7.6 15.7 10.3 14.3 14.7H9.7L8.3 10.3 12 7.6Z" />
          </svg>
        </Link>
      </Tip>

      <nav className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
        {LINKS.map((l) => (
          <Tip key={l.key} label={l.tip}>
            <Link
              href={l.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                active === l.key
                  ? "bg-lime text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          </Tip>
        ))}
      </nav>

      <Tip label="Buscar">
        <label className="hidden h-10 items-center gap-2.5 rounded-xl bg-white/10 px-3.5 md:flex">
          <IconSearch className="size-4 text-white/40" />
          <input placeholder="Buscar" className="w-36 bg-transparent text-[13px] text-white placeholder:text-white/35 outline-none xl:w-48" />
        </label>
      </Tip>

      <Tip label="Notificaciones (3)">
        <button type="button" aria-label="Notificaciones" className="relative flex size-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 15v-4.5a6 6 0 1 0-12 0V15l-1.8 2.6h15.6L18 15Z" /><path d="M10 20.6a2.2 2.2 0 0 0 4 0" /></svg>
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#e05a3a]" />
        </button>
      </Tip>

      <Tip label="Adward Kollins · @edwardk" side="bottom">
        <button type="button" className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-white/10">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 via-rose-400 to-rose-600 text-[11px] font-bold text-white">
            AK
          </span>
        </button>
      </Tip>
    </header>
  );
}
