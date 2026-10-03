"use client";

import { useEffect, useState } from "react";
import { APPS } from "./apps";
import { useDesktopActions, useLauncher } from "./launcher";
import { BrandLogo } from "./brand-logo";
import { Goal50Clock } from "./clock";
import { Goal50NotificationBell } from "./notification-bell";
import { Goal50MessageBell } from "./message-bell";
import { Goal50FriendBell } from "./friend-bell";
import { LogoMark } from "./logo-mark";
import { useEnergy } from "@/lib/energy";
import { NEED_KEYS, NEED_META, useNeeds } from "@/lib/needs";
import { pushEscapeHandler } from "@/lib/escape";

/* ---------- barra superior estilo macOS (cristal) ---------- */

export function Goal50TopBar({
  streak,
  coins,
  bottles,
  kg,
}: {
  streak: number;
  coins: number;
  bottles: number;
  kg: number;
}) {
  const energy = useEnergy();
  const needs = useNeeds();
  const [needsOpen, setNeedsOpen] = useState(false);
  const needRows = [
    { key: "energy", label: "Energía", emoji: "⚡", value: energy },
    ...NEED_KEYS.map((key) => ({ key, label: NEED_META[key].label, emoji: NEED_META[key].emoji, value: needs[key] })),
  ];

  useEffect(() => {
    if (!needsOpen) return;
    return pushEscapeHandler(() => {
      setNeedsOpen(false);
      return true;
    });
  }, [needsOpen]);
  return (
    <header className="goal50-chrome goal50-glass fixed inset-x-0 top-0 flex h-11 items-center gap-3 border-b px-4">
      <BrandLogo className="h-6 w-auto" />
      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="goal50-tile flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
          title="Racha"
          data-tipb="Racha"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#ff8a3d" }}>
            <path d="M12 3c.8 2.4-.6 3.6-1.7 4.8C9.1 9.2 8 10.5 8 12.5A4 4 0 0 0 16 12.5c0-1.3-.6-2.3-1.2-3.2-.3.6-.8 1-1.4 1.2.5-2.6-.6-5.3-1.4-7.5Z" />
          </svg>
          {streak}
        </span>
        <span
          className="goal50-tile flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
          title="Crack Coins"
          data-tipb="Crack Coins"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "#e0b23a" }}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5v9M14.6 9.3c-.5-.7-1.4-1.1-2.6-1.1-1.5 0-2.6.7-2.6 1.8 0 2.6 5.4 1.2 5.4 3.9 0 1.2-1.2 1.9-2.8 1.9-1.3 0-2.3-.5-2.8-1.3" strokeLinecap="round" />
          </svg>
          {coins}
        </span>
        <span
          className="goal50-tile flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
          title="Botellas totales"
          data-tipb="Botellas totales"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#5eead4" }}>
            <path d="M10 2h4v3l1.4 2.1A4 4 0 0 1 16 9.3V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.3a4 4 0 0 1 .6-2.2L10 5V2Z" />
          </svg>
          {bottles}
        </span>
        <span
          className="goal50-tile flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
          title="KG estimados"
          data-tipb="KG estimados"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#fbbf24" }}>
            <path d="M12 3a3 3 0 0 0-3 3H5.5L3 21h18L18.5 6H15a3 3 0 0 0-3-3Z" />
            <path d="M9 6a3 3 0 0 1 6 0" />
          </svg>
          {kg.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={() => setNeedsOpen((v) => !v)}
          aria-label="Necesidades"
          data-tipb="Necesidades"
          className="goal50-tile flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.3-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 3.5C19 16.7 12 21 12 21Z" />
          </svg>
          <span className="hidden sm:inline">Necesidades</span>
        </button>
        {needsOpen ? (
          <div className="g50-panel absolute right-3 top-12 w-[230px] rounded-2xl p-3">
            <p className="goal50-text-dim mb-2 text-[10px] font-bold uppercase tracking-[0.16em]">Necesidades</p>
            <div className="flex flex-col gap-2">
              {needRows.map((row) => {
                const color = row.value >= 50 ? "#7bd44a" : row.value >= 20 ? "#febc2e" : "#ff5f57";
                return (
                  <div key={row.key}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">{row.emoji}</span>
                      <span className="goal50-text flex-1 text-[11px] font-semibold">{row.label}</span>
                      <span className="goal50-text-dim text-[11px] tabular-nums">{row.value.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full transition-[width]" style={{ width: `${row.value}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <Goal50Clock />
        <Goal50MessageBell />
        <Goal50FriendBell />
        <Goal50NotificationBell />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-settings"))}
          aria-label="Configuración"
          data-tipb="Configuración"
          className="goal50-tile flex size-7 items-center justify-center rounded-full"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

/* ---------- menú principal (rail en escritorio, barra inferior en móvil) ---------- */

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20c1.2-3.4 4-5.2 7.2-5.2s6 1.8 7.2 5.2" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </svg>
  );
}

export function Goal50Menu() {
  const launch = useLauncher();
  const { confirmExit } = useDesktopActions();
  const [open, setOpen] = useState(false);

  const quick = [APPS[0], APPS[3], APPS[1], APPS[2]];

  const openApp = (key: string) => {
    launch(key);
    setOpen(false);
  };

  const openProfile = () => {
    window.dispatchEvent(new CustomEvent("goal50:open-profile"));
    setOpen(false);
  };

  return (
    <>
      {/* escritorio: rail vertical de cristal */}
      <aside className="goal50-chrome goal50-glass fixed bottom-0 left-0 top-11 hidden w-[76px] flex-col items-center gap-4 border-r py-5 md:flex">
        <nav className="flex flex-col items-center gap-2">
          {APPS.map((app) => (
            <button
              key={app.key}
              type="button"
              aria-label={app.label}
              data-tipr={app.label}
              onClick={() => launch(app.key)}
              className="goal50-tile flex size-11 items-center justify-center rounded-2xl"
            >
              {app.icon}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label="Perfil de usuario"
            data-tipr="Perfil de usuario"
            onClick={openProfile}
            className="goal50-tile goal50-tile--muted flex size-11 items-center justify-center rounded-2xl"
          >
            <ProfileIcon />
          </button>
          <button
            type="button"
            aria-label="Salir"
            data-tipr="Salir"
            onClick={confirmExit}
            className="goal50-tile goal50-tile--danger flex size-11 items-center justify-center rounded-2xl"
          >
            <ExitIcon />
          </button>
        </div>
      </aside>

      {/* móvil: barra inferior con botón central */}
      <nav className="goal50-chrome goal50-glass fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {quick.slice(0, 2).map((app) => (
          <button
            key={app.key}
            type="button"
            aria-label={app.label}
            onClick={() => launch(app.key)}
            className="goal50-text-dim flex w-16 flex-col items-center gap-1 rounded-xl py-1.5"
          >
            {app.icon}
            <span className="text-[9px] font-semibold uppercase tracking-wide">{app.label}</span>
          </button>
        ))}

        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="-mt-7 flex size-16 items-center justify-center rounded-full bg-lime text-black shadow-[0_10px_30px_rgba(198,242,50,0.45)] ring-4 ring-white/10 transition hover:brightness-110"
        >
          <LogoMark className="size-9" />
        </button>

        {quick.slice(2).map((app) => (
          <button
            key={app.key}
            type="button"
            aria-label={app.label}
            onClick={() => launch(app.key)}
            className="goal50-text-dim flex w-16 flex-col items-center gap-1 rounded-xl py-1.5"
          >
            {app.icon}
            <span className="text-[9px] font-semibold uppercase tracking-wide">{app.label}</span>
          </button>
        ))}
      </nav>

      {/* menú modal de cristal */}
      <div className={`fixed inset-0 z-[2147481000] flex items-center justify-center p-6 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`goal50-glass goal50-glass-strong relative w-full max-w-[340px] rounded-[30px] border p-6 transition-all duration-300 ${
            open ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <BrandLogo className="h-7 w-auto" />
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="goal50-tile flex size-9 items-center justify-center rounded-full"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-3">
            {APPS.map((app) => (
              <button
                key={app.key}
                type="button"
                onClick={() => openApp(app.key)}
                className="goal50-tile flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left"
              >
                <span className="[&_svg]:size-4.5">{app.icon}</span>
                <span className="text-[12.5px] font-semibold">{app.label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={openProfile}
            className="goal50-tile mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-[12.5px] font-semibold"
          >
            <span className="[&_svg]:size-4.5">
              <ProfileIcon />
            </span>
            Perfil de usuario
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              confirmExit();
            }}
            className="goal50-tile goal50-tile--danger mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-[12.5px] font-semibold"
          >
            <span className="[&_svg]:size-4.5">
              <ExitIcon />
            </span>
            Salir
          </button>
        </div>
      </div>
    </>
  );
}
