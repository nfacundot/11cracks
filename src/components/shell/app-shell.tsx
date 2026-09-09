"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavigationGroup, NavigationItem, ShellRole } from "@/lib/shell/navigation";
import { NavigationIcon } from "./navigation-icon";
import { RoleAtmosphere } from "./role-atmosphere";
import { LogoutForm } from "./logout-form";

export type ShellUser = {
  name: string;
  username: string;
  avatarUrl: string | null;
  role: ShellRole;
  scopeLabel?: string;
};

const roleNames: Record<ShellRole, string> = {
  player: "Jugador",
  coach: "Entrenador",
  admin: "Administración",
  superadmin: "Gobierno global",
};

const profileHrefByRole: Record<ShellRole, string> = {
  player: "/jugador/profile",
  coach: "/coach/perfil",
  admin: "/admin/profile",
  superadmin: "/superadmin/perfil",
};

const playerDockIds = new Set(["dashboard", "progress", "training", "neurocracks"]);

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  const isRoot = href.split("/").filter(Boolean).length <= 1;
  if (isRoot) return false;
  return pathname.startsWith(`${href}/`);
}

function Avatar({ user, size = 44 }: { user: ShellUser; size?: number }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="shell-avatar__image" src={user.avatarUrl} alt={user.name} width={size} height={size} />;
  }
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className="shell-avatar__initials">{initials}</span>;
}

function NavLink({ item, pathname, onNavigate }: { item: NavigationItem; pathname: string; onNavigate?: () => void }) {
  const active = isActivePath(pathname, item.href);
  return (
    <Link
      className="shell-nav__link"
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-active={active}
      onClick={onNavigate}
    >
      <span className="shell-nav__icon"><NavigationIcon name={item.icon} /></span>
      <span>{item.label}</span>
      <span className="shell-nav__active-mark" aria-hidden="true" />
    </Link>
  );
}

function Navigation({ groups, pathname, onNavigate }: { groups: NavigationGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="shell-nav" aria-label="Navegación principal">
      {groups.map((group) => (
        <section className="shell-nav__group" key={group.id} aria-labelledby={`nav-${group.id}`}>
          <h2 id={`nav-${group.id}`}>{group.label}</h2>
          <div>
            {group.items.map((item) => <NavLink key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} />)}
          </div>
        </section>
      ))}
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="shell-brand-context" data-compact={compact}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/emotes/11-crackslogta.svg" alt="11Cracks" />
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

function AccountActions({ user, showNavigationLinks = true }: { user: ShellUser; showNavigationLinks?: boolean }) {
  return (
    <div className="shell-account-actions">
      {showNavigationLinks ? <Link href={profileHrefByRole[user.role]}>{user.role === "player" ? "Perfil" : "Perfil"}</Link> : null}
      {showNavigationLinks ? <Link href={profileHrefByRole[user.role]}>Configuración</Link> : null}
      <LogoutForm />
    </div>
  );
}

export function AppShell({ user, groups, children, clubLogo, scopeLabel }: { user: ShellUser; groups: NavigationGroup[]; children: React.ReactNode; clubLogo?: string | null; scopeLabel?: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const currentItem = useMemo(
    () => groups.flatMap((group) => group.items).find((item) => isActivePath(pathname, item.href)),
    [groups, pathname],
  );
  const navigationItems = groups.flatMap((group) => group.items);
  const dockItems = user.role === "player"
    ? navigationItems.filter((item) => playerDockIds.has(item.id))
    : navigationItems.filter((item) => item.id !== "profile" && item.id !== "settings").slice(0, 4);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }, []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const panel = drawerPanelRef.current;
    document.body.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const manageFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", manageFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", manageFocus);
    };
  }, [closeDrawer, drawerOpen]);

  const effectiveScope = scopeLabel ?? (user.role === "player" ? "Mi recorrido" : roleNames[user.role]);

  return (
    <div className="app-shell" data-role={user.role} data-player-home={pathname === "/jugador"}>
      <RoleAtmosphere role={user.role} />

      <aside className="shell-rail">
        <Brand />
        <Navigation groups={groups} pathname={pathname} />
        <div className="shell-rail__identity">
          <span className="shell-avatar"><Avatar user={user} /></span>
          <div><strong>{user.name}</strong><small>{effectiveScope}</small></div>
        </div>
      </aside>

      <div className="shell-mobile-head">
        <Brand compact />
        {user.role === "player" && clubLogo ? (
          <div className="shell-mobile-scope" aria-label={`Alcance activo: ${effectiveScope}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="shell-mobile-scope__club" src={clubLogo} alt="" />
          </div>
        ) : null}
        <button
          ref={menuTriggerRef}
          className="shell-menu-trigger"
          type="button"
          aria-label="Abrir navegación"
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation"
          onClick={openDrawer}
        ><span /><span /></button>
      </div>

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-location" aria-label="Ubicación actual">
            <span>{roleNames[user.role]}</span>
            <strong>{currentItem?.label ?? "11 Cracks"}</strong>
          </div>
          <div className="shell-scope">
            {clubLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="shell-scope__club" src={clubLogo} alt="" />
            ) : <span aria-hidden="true" />}
            <div><small>Alcance activo</small><strong>{effectiveScope}</strong></div>
          </div>
          <details className="shell-account shell-account--player-control">
            <summary aria-label="Abrir opciones de cuenta">
              <span className="shell-account__control-icon" aria-hidden="true"><NavigationIcon name="profile" /></span>
              <span className="shell-account__chevron" aria-hidden="true"><ChevronDownIcon /></span>
            </summary>
            <AccountActions user={user} />
          </details>
        </header>

        <main className="shell-content">{children}</main>
      </div>

      <nav className="shell-dock" aria-label="Navegación rápida">
        {dockItems.map((item) => (
          <NavLink key={item.id} item={item} pathname={pathname} />
        ))}
        {user.role !== "player" ? (
          <button type="button" onClick={openDrawer} aria-label="Abrir menú completo">
            <span className="shell-dock__more" aria-hidden="true"><i /><i /><i /></span>
            <span>Menú</span>
          </button>
        ) : null}
      </nav>

      <div className="shell-drawer" data-open={drawerOpen} aria-hidden={!drawerOpen}>
        <button className="shell-drawer__backdrop" type="button" aria-label="Cerrar navegación" onClick={closeDrawer} tabIndex={drawerOpen ? 0 : -1} />
        <aside ref={drawerPanelRef} id="mobile-navigation" className="shell-drawer__panel" role="dialog" aria-modal="true" aria-label="Menú completo">
          <header><Brand compact /><button ref={drawerCloseRef} type="button" onClick={closeDrawer} aria-label="Cerrar navegación"><CloseIcon /></button></header>
          <Navigation groups={groups} pathname={pathname} onNavigate={closeDrawer} />
          <div className="shell-drawer__account">
            <span className="shell-avatar"><Avatar user={user} /></span>
            <div><strong>{user.name}</strong><small>{effectiveScope}</small></div>
          </div>
          <AccountActions user={user} showNavigationLinks={user.role !== "player" && user.role !== "superadmin"} />
        </aside>
      </div>
    </div>
  );
}
