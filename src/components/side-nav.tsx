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
  { href: "/learn", label: "Aprender", icon: <HomeIcon className="h-[18px] w-[18px]" /> },
  { href: "/games", label: "Juegos", icon: <GamepadIcon className="h-[18px] w-[18px]" /> },
  { href: "/ranking", label: "Ranking", icon: <TrophyIcon className="h-[18px] w-[18px]" /> },
  { href: "/teams", label: "Equipos", icon: <ShieldIcon className="h-[18px] w-[18px]" /> },
  { href: "/profile", label: "Perfil", icon: <UserIcon className="h-[18px] w-[18px]" /> },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-[300px] shrink-0 flex-col border-r border-white/[0.04] bg-[#020303] max-md:hidden">
      <div className="flex items-center justify-center px-6 py-6">
        <img
          src="/img/emotes/11-crackslogta.svg"
          alt="11Cracks"
          className="h-17 w-auto object-contain"
        />
      </div>

      <div className="px-3">
        <span className="section-label px-3 py-2 block">Menú</span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/learn" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
