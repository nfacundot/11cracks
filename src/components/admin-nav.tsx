"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  GamepadIcon,
  HomeIcon,
  UsersIcon,
  ShieldIcon,
  BookIcon,
  StarIcon,
  MapIcon,
  JoystickIcon,
  LogOutIcon,
} from "@/components/icons";

const links: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/admin", label: "Dashboard", icon: <HomeIcon className="h-5 w-5" /> },
  { href: "/admin/users", label: "Usuarios", icon: <UsersIcon className="h-5 w-5" /> },
  { href: "/admin/etapas", label: "Etapas", icon: <BookIcon className="h-5 w-5" /> },
  { href: "/admin/asignaturas", label: "Asignaturas", icon: <StarIcon className="h-5 w-5" /> },
  { href: "/admin/caminos", label: "Caminos", icon: <MapIcon className="h-5 w-5" /> },
  { href: "/admin/lessons", label: "Lecciones", icon: <GamepadIcon className="h-5 w-5" /> },
  { href: "/admin/juegos", label: "Juegos", icon: <JoystickIcon className="h-5 w-5" /> },
  { href: "/admin/teams", label: "Equipos", icon: <ShieldIcon className="h-5 w-5" /> },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-green-100 bg-white/60 backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-green-100 px-5 py-4 dark:border-emerald-900">
        <Image
          src="/img/icons/faviconlit.png"
          alt="11Cracks"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-xl object-cover"
        />
        <div>
          <p className="text-sm font-black text-emerald-950 dark:text-white">11Cracks Admin</p>
          <p className="text-[10px] font-bold text-zinc-400">Panel de administración</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
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

      <div className="border-t border-green-100 p-3 dark:border-emerald-900">
        <Link
          href="/learn"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
        >
          <GamepadIcon className="h-5 w-5" />
          Ver la app
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-600 transition hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
        >
          <LogOutIcon className="h-5 w-5" />
          Mi perfil
        </Link>
      </div>
    </aside>
  );
}
