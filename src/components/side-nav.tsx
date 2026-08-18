"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  GamepadIcon,
  HomeIcon,
  ShieldIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";

const links: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/learn", label: "Aprender", icon: <HomeIcon className="h-5 w-5" /> },
  { href: "/games", label: "Juegos", icon: <GamepadIcon className="h-5 w-5" /> },
{ href: "/ranking", label: "Ranking", icon: <TrophyIcon className="h-5 w-5" /> },
  { href: "/teams", label: "Equipos", icon: <ShieldIcon className="h-5 w-5" /> },
  { href: "/profile", label: "Perfil", icon: <UserIcon className="h-5 w-5" /> },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-64 shrink-0 flex-col border-r border-green-100 bg-white/60 backdrop-blur-xl dark:border-green-900 dark:bg-emerald-950/60 max-md:hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/faviconlit.png" alt="11Cracks" className="h-8 w-8" />
        <span className="text-lg font-black text-emerald-950 dark:text-white">
          11Cracks
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/learn" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-950"
                  : "text-zinc-500 hover:bg-green-50 hover:text-emerald-950 dark:text-zinc-400 dark:hover:bg-emerald-900 dark:hover:text-white"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
