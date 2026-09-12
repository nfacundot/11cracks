"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  BarChartIcon,
  GamepadIcon,
  HomeIcon,
  UsersIcon,
  ShieldIcon,
  BookIcon,
  StarIcon,
  JoystickIcon,
  LogOutIcon,
} from "@/components/icons";
import { roleLabel } from "@/lib/roles";

const PROFILE_URL: Record<string, string> = {
  JUGADOR: "/jugador/profile",
  ENTRENADOR: "/coach/perfil",
  ADMIN: "/admin/profile",
  SUPERADMIN: "/superadmin/perfil",
};

const NAV_ITEMS: { path: string; label: string; icon: ReactNode }[] = [
  { path: "", label: "Dashboard", icon: <HomeIcon className="h-5 w-5" /> },
  { path: "/indicators", label: "Indicadores", icon: <StarIcon className="h-5 w-5" /> },
  { path: "/caracteristicas", label: "Características", icon: <BarChartIcon className="h-5 w-5" /> },
  { path: "/users", label: "Usuarios", icon: <UsersIcon className="h-5 w-5" /> },
  { path: "/etapas", label: "Etapas", icon: <BookIcon className="h-5 w-5" /> },
  { path: "/asignaturas", label: "Asignaturas", icon: <StarIcon className="h-5 w-5" /> },
  { path: "/caminos", label: "Caminos", icon: <BookIcon className="h-5 w-5" /> },
  { path: "/lessons", label: "Lecciones", icon: <GamepadIcon className="h-5 w-5" /> },
  { path: "/settings/lecciones", label: "Juegos", icon: <JoystickIcon className="h-5 w-5" /> },
  { path: "/teams", label: "Equipos", icon: <ShieldIcon className="h-5 w-5" /> },
];

export function AdminNav({
  basePath,
  title,
  subtitle,
  user,
}: {
  basePath: string;
  title: string;
  subtitle: string;
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}) {
  const pathname = usePathname();
  const [realPath, setRealPath] = useState<string | null>(null);

  if (pathname && pathname !== basePath && pathname !== realPath) {
    setRealPath(pathname);
  }

  const effectivePath = realPath ?? pathname;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const items =
    basePath === "/superadmin"
      ? [{ path: "", label: "Vista Global", icon: <HomeIcon className="h-5 w-5" /> }]
      : NAV_ITEMS;
  const links = items.map((item) => ({
    ...item,
    href: `${basePath}${item.path}`,
  }));
  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-green-100 bg-white/60 backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-green-100 px-5 py-4 dark:border-emerald-900">
        <Image
          src="/img/icons/faviconlit.png"
          alt="11Cracks"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-xl object-cover"
        />
        <div>
          <p className="text-sm font-black text-emerald-950 dark:text-white">{title}</p>
          <p className="text-[10px] font-bold text-zinc-400">{subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const active =
            effectivePath === link.href ||
            (link.href !== basePath && effectivePath.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-950"
                  : "text-zinc-600 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-green-100 p-3 dark:border-emerald-900">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-amber-500/40 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {initials}
              </span>
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-bold uppercase leading-none text-emerald-950 dark:text-white">
              {user.name}
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
              {roleLabel(user.role)}
            </span>
            <span className="truncate text-[10px] font-medium text-zinc-400">
              @{user.username} · Red 11 Cracks
            </span>
          </div>
        </div>
        <Link
          href="/jugador/learn"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
        >
          <GamepadIcon className="h-5 w-5" />
          Ver la app
        </Link>
        <Link
          href={PROFILE_URL[user.role] ?? "/jugador/profile"}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
        >
          <LogOutIcon className="h-5 w-5" />
          Mi perfil
        </Link>
      </div>
    </aside>
  );
}
