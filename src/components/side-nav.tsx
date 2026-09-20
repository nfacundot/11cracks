"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChartIcon,
  BallIcon,
  CoinIcon,
  DumbbellIcon,
  HomeIcon,
  MapIcon,
  PlayIcon,
  SettingsIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
  UserPlusIcon,
} from "@/components/icons";
import { roleLabel } from "@/lib/roles";

type Item = { href: string; label: string; icon: ReactNode };
type Group = { label: string; items: Item[] };

function groupsFor(): Group[] {
  return [
    {
      label: "Entrenamiento",
      items: [
        { href: "/jugador", label: "Inicio", icon: <HomeIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/progress", label: "Mi Progreso", icon: <BarChartIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/entrenamiento", label: "Entrenamiento", icon: <DumbbellIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/camino", label: "El Camino", icon: <MapIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/videos", label: "Videos", icon: <PlayIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/postulaciones", label: "Postulaciones", icon: <UserPlusIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/neurocracks", label: "NeuroCracks", icon: <StarIcon className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: "Tu mundo",
      items: [
        { href: "/jugador/alineacion", label: "Alineación", icon: <BallIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/logros", label: "Logros", icon: <TrophyIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/billetera-solidaria", label: "Billetera Solidaria", icon: <CoinIcon className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: "Cuenta",
      items: [
        { href: "/jugador/profile", label: "Mi perfil", icon: <UserIcon className="h-[18px] w-[18px]" /> },
        { href: "/jugador/configuracion", label: "Configuración", icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
      ],
    },
  ];
}

export function SideNav({
  user,
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/jugador"
      ? pathname === "/jugador"
      : pathname === href || pathname.startsWith(`${href}/`);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className="sticky top-0 flex h-dvh w-[300px] shrink-0 flex-col border-r border-white/[0.04] tk-bar max-md:hidden">
      <div className="flex shrink-0 items-center justify-center px-6 py-6">
        <img
          src="/img/emotes/11-crackslogta.svg"
          alt="11Cracks"
          className="h-12 w-auto object-contain"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-4">
          {groupsFor().map((group) => (
            <div key={group.label}>
              <span className="section-label px-3 py-2 block">{group.label}</span>
              <div className="mt-1 flex flex-col gap-0.5">
                {group.items.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-item ${isActive(link.href) ? "active" : ""}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-white/[0.06] px-5 py-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-10 w-10 shrink-0 rounded-full border-2 border-[#C9A24A]/40 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10">
            <span className="text-xs font-bold text-[#C9A24A]">{initials}</span>
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-bold uppercase leading-none text-(--text-primary)">
            {user.name}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C9A24A]">
            {roleLabel(user.role)}
          </span>
          <span className="truncate text-[10px] font-medium text-[#686862]">
            @{user.username} · Red 11 Cracks
          </span>
        </div>
      </div>
    </nav>
  );
}