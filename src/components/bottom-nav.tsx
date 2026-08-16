"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  DumbbellIcon,
  GamepadIcon,
  HomeIcon,
  ShieldIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";

const links: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/learn", label: "Aprender", icon: <HomeIcon className="h-6 w-6" /> },
  { href: "/games", label: "Juegos", icon: <GamepadIcon className="h-6 w-6" /> },
  { href: "/training", label: "Entreno", icon: <DumbbellIcon className="h-6 w-6" /> },
  { href: "/ranking", label: "Ranking", icon: <TrophyIcon className="h-6 w-6" /> },
  { href: "/teams", label: "Equipos", icon: <ShieldIcon className="h-6 w-6" /> },
  { href: "/profile", label: "Perfil", icon: <UserIcon className="h-6 w-6" /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-white/55 backdrop-blur-xl dark:border-green-900 dark:bg-emerald-950/55">
      <div className="safe-bottom mx-auto flex w-full max-w-md items-stretch justify-between">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/learn" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-bold transition ${
                active
                  ? "text-green-600 dark:text-green-400"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
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
