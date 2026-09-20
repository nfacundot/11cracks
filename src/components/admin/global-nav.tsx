"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChartIcon,
  BoltIcon,
  BookIcon,
  CoinIcon,
  EyeIcon,
  FlameIcon,
  HomeIcon,
  LockIcon,
  SettingsIcon,
  ShieldIcon,
  TimerIcon,
  TrophyIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/icons";

type Item = { href: string; label: string; short: string; icon: ReactNode };
type Group = { label: string; items: Item[] };

function groupsFor(base: string): Group[] {
  if (base === "/admin") {
    return [
      {
        label: "Organización",
        items: [
          { href: `${base}/dashboard`, label: "Inicio", short: "Inicio", icon: <HomeIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/clubes`, label: "Clubes", short: "Clubes", icon: <ShieldIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/usuarios`, label: "Usuarios", short: "Usuarios", icon: <UsersIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/contenido`, label: "Contenido", short: "Contenido", icon: <BookIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/reportes`, label: "Reportes", short: "Reportes", icon: <BarChartIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/certificaciones`, label: "Certificaciones", short: "Certificados", icon: <TrophyIcon className="h-[18px] w-[18px]" /> },
        ],
      },
      {
        label: "Operación y control",
        items: [
          { href: `${base}/pagos`, label: "Pagos", short: "Pagos", icon: <BarChartIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/billetera`, label: "Billetera", short: "Billetera", icon: <CoinIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/impacto`, label: "Impacto", short: "Impacto", icon: <FlameIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/postulaciones`, label: "Postulaciones", short: "Postulaciones", icon: <UserPlusIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/auditoria`, label: "Auditoría", short: "Auditoría", icon: <EyeIcon className="h-[18px] w-[18px]" /> },
        ],
      },
      {
        label: "Cuenta",
        items: [
          { href: `${base}/perfil`, label: "Perfil", short: "Perfil", icon: <UserIcon className="h-[18px] w-[18px]" /> },
          { href: `${base}/configuracion`, label: "Configuración", short: "Ajustes", icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
        ],
      },
    ];
  }

  return [
    {
      label: "Gobierno global",
      items: [
        { href: `${base}/organizaciones`, label: "Organizaciones", short: "Organizaciones", icon: <ShieldIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/administradores`, label: "Administradores", short: "Admins", icon: <UserPlusIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/permisos`, label: "Permisos", short: "Permisos", icon: <LockIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/usuarios`, label: "Usuarios", short: "Usuarios", icon: <UsersIcon className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: "Plataforma",
      items: [
        { href: `${base}/contenido`, label: "Contenido", short: "Contenido", icon: <BookIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/billetera`, label: "Billetera", short: "Billetera", icon: <CoinIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/pagos`, label: "Pagos", short: "Pagos", icon: <BarChartIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/impacto`, label: "Impacto", short: "Impacto", icon: <FlameIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/auditoria`, label: "Auditoría", short: "Auditoría", icon: <EyeIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/integraciones`, label: "Integraciones", short: "Integraciones", icon: <BoltIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/sistema`, label: "Sistema", short: "Sistema", icon: <TimerIcon className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: "Cuenta",
      items: [
        { href: `${base}/perfil`, label: "Perfil", short: "Perfil", icon: <UserIcon className="h-[18px] w-[18px]" /> },
        { href: `${base}/configuracion`, label: "Configuración", short: "Ajustes", icon: <SettingsIcon className="h-[18px] w-[18px]" /> },
      ],
    },
  ];
}

function useActive(base: string) {
  const pathname = usePathname();

  return (href: string) => {
    // Para la raíz y /dashboard solo match exacto; para subrutas, match por prefijo
    if (href === base || href === `${base}/dashboard`) {
      return pathname === base || pathname === `${base}/dashboard`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

export function GlobalSideNav({
  user,
  basePath = "/superadmin",
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  basePath?: string;
}) {
  const isActive = useActive(basePath);
  const groups = groupsFor(basePath);
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
          {groups.map((group) => (
            <div key={group.label}>
              {group.label ? (
                <span className="section-label px-3 py-2 block">{group.label}</span>
              ) : null}
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
            {basePath === "/admin" ? "Administrador" : "Superadministrador"}
          </span>
          <span className="truncate text-[10px] font-medium text-[#686862]">
            @{user.username} · Red 11 Cracks
          </span>
        </div>
      </div>
    </nav>
  );
}

export function GlobalBottomNav({ basePath = "/superadmin" }: { basePath?: string }) {
  const isActive = useActive(basePath);
  const items = groupsFor(basePath)[0].items;

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
