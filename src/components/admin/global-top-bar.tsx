"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/actions/auth";
import {
  ChevronDownIcon,
  LogOutIcon,
  UserIcon,
} from "@/components/icons";

export function GlobalTopBar({
  user,
  title = "Vista Global",
  roleText = "Superadministrador",
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role?: string;
  };
  title?: string;
  roleText?: string;
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

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-[#C9A24A]/10 bg-[#020303]/90 backdrop-blur-md">
      <div className="flex h-[70px] items-center justify-between px-5 md:px-8">
        {/* Left: Role + Page */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#686862]">
            {roleText}
          </span>
          <span className="text-[22px] font-bold uppercase leading-none tracking-wide text-[#F2F0E9] md:text-[26px]">
            {title}
          </span>
        </div>

        {/* Right: Network status + Avatar dropdown */}
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end gap-0.5 sm:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A5A39C]">
              Alcance
            </span>
            <span className="text-[11px] font-medium text-[#686862]">
              Toda la red · Global
            </span>
          </div>

          <img
            src="/img/icons/favicon.png"
            alt=""
            className="hidden h-8 w-8 shrink-0 rounded-full border border-[#C9A24A]/20 sm:block"
          />

          {/* Profile dropdown */}
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-[#C9A24A]/20 bg-[#080909] px-3 py-2 transition hover:border-[#C9A24A]/40 hover:bg-[#0B0D0D]"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A24A]/15 text-[10px] font-bold text-[#C9A24A]">
                  {initials}
                </div>
              )}
              <ChevronDownIcon
                className={`h-3.5 w-3.5 shrink-0 text-[#686862] transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[260px] overflow-hidden rounded-[12px] border border-[#806322]/30 bg-[#080909] shadow-2xl shadow-black/60">
                <div className="border-b border-[#C9A24A]/10 px-5 py-3">
                  <p className="truncate text-[13px] font-bold text-[#F2F0E9]">{user.name}</p>
                  <p className="truncate text-[11px] text-[#686862]">@{user.username}</p>
                </div>
                <Link
                  href="/jugador/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-[#A5A39C] transition hover:bg-[#0E1111] hover:text-[#F2F0E9]"
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  Mi perfil
                </Link>
                <div className="border-t border-[#C9A24A]/10" />
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-[#A5A39C] transition hover:bg-[#0E1111] hover:text-[#F2F0E9]"
                >
                  <LogOutIcon className="h-4 w-4 shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
