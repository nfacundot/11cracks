"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/actions/auth";
import {
  ChevronDownIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Jugador",
  ADMIN: "Administrador",
  COACH: "Entrenador",
  PARENT: "Padre / Madre",
};

export function TopBar({
  user,
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-white/10 backdrop-blur-xl dark:bg-emerald-950/30">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex flex-col">
          <span className="text-[11px] font-black leading-tight text-green-600 dark:text-green-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <span className="text-sm font-black leading-tight text-emerald-950 dark:text-white">
            {process.env.NEXT_PUBLIC_SITE_NAME || "11Cracks"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/icons/favicon.png" alt="" className="h-6 w-6 shrink-0 rounded-full ring-1 ring-white/20" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black leading-tight text-emerald-950 dark:text-white">
                11Cracks FC
              </span>
              <span className="text-[10px] font-bold leading-tight text-zinc-400 dark:text-zinc-500">
                Futbol y aprendizaje
              </span>
            </div>
          </div>

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 rounded-xl bg-white/10 px-2 py-2 transition hover:bg-white/20"
            >
              <UserIcon className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-300" />
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-white/95 shadow-xl backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/95">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-green-50 dark:text-zinc-200 dark:hover:bg-emerald-900"
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  Perfil
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-green-50 dark:text-zinc-200 dark:hover:bg-emerald-900"
                >
                  <SettingsIcon className="h-4 w-4 shrink-0" />
                  Configuración
                </Link>
                <div className="border-t border-zinc-100 dark:border-emerald-900" />
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOutIcon className="h-4 w-4 shrink-0" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
