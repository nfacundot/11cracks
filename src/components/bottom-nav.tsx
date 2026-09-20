"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChartIcon,
  HomeIcon,
  StarIcon,
} from "@/components/icons";

type Item = { href: string; label: string; short: string; icon: ReactNode };

const items: Item[] = [
  { href: "/jugador", label: "Inicio", short: "Inicio", icon: <HomeIcon className="h-5 w-5" /> },
  { href: "/jugador/progress", label: "Mi Progreso", short: "Progreso", icon: <BarChartIcon className="h-5 w-5" /> },
  { href: "/jugador/neurocracks", label: "NeuroCracks", short: "Neuro", icon: <StarIcon className="h-5 w-5" /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/jugador"
      ? pathname === "/jugador"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.04] tk-bar backdrop-blur-xl md:hidden">
      <div className="safe-bottom mx-auto flex w-full max-w-md items-stretch justify-between">
        {items.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-[10px] font-semibold uppercase tracking-wide transition ${
              isActive(link.href)
                ? "text-[#C9A24A]"
                : "text-[#686862] hover:text-[#A5A39C]"
            }`}
          >
            {link.icon}
            {link.short}
          </Link>
        ))}
      </div>
    </nav>
  );
}