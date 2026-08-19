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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.04] bg-[#020303]/95 backdrop-blur-xl md:hidden">
      <div className="safe-bottom mx-auto flex w-full max-w-md items-stretch justify-between">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/learn" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "text-[#C9A24A]"
                  : "text-[#686862] hover:text-[#A5A39C]"
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
