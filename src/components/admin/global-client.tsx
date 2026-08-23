"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChartIcon, ShieldIcon, TimerIcon } from "@/components/icons";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const SUMMARY = [
  { value: "2", label: "clubes" },
  { value: "2", label: "players" },
  { value: "1", label: "coaches" },
];

const PRIORITY = [
  "2 h pendientes de validación",
  "1 nominación pendiente",
  "1 contenido en borrador",
];

const ACTIONS = [
  { href: "/admin/clubes", label: "Gestionar clubes", icon: <ShieldIcon className="h-4 w-4 shrink-0" /> },
  { href: "/admin/auditoria", label: "Revisar horas", icon: <TimerIcon className="h-4 w-4 shrink-0" /> },
  { href: "/admin/reportes", label: "Abrir reportes", icon: <BarChartIcon className="h-4 w-4 shrink-0" /> },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
      <h3
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ fontFamily: S.barlow, color: S.textSecondary }}
      >
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdminDashboardBody({ title = "Dashboard" }: { title?: string }) {
  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero ─── */}
      <GlobalHero
        title={title}
        subtitle="Operación autorizada · alcance administrativo de tu organización"
      />

      {/* ─── Paneles ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Resumen operativo">
          <div className="flex items-end gap-8 max-sm:gap-6">
            {SUMMARY.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span
                  style={{
                    fontFamily: S.barlow,
                    fontWeight: 800,
                    fontSize: "clamp(30px, 3vw, 40px)",
                    lineHeight: 1,
                    color: S.textPrimary,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em]"
                  style={{ fontFamily: S.barlow, color: S.textSecondary }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Atención prioritaria">
          <ul className="flex flex-col gap-3">
            {PRIORITY.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[13px] font-medium"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: S.gold }}
                />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ─── Acciones rápidas ─── */}
      <section>
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Acciones rápidas
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-center gap-2.5 rounded-[12px] border border-[#C9A24A]/20 bg-[#080909] px-4 py-3.5 text-[13px] font-semibold transition hover:border-[#C9A24A]/40 hover:bg-[#0B0D0D]"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GlobalClient({
  hero,
  basePath = "/superadmin",
}: {
  hero?: { title: string; subtitle: string };
  basePath?: string;
}) {
  if (!hero && basePath === "/admin") {
    return <AdminDashboardBody />;
  }

  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero ─── */}
      <div className="px-0 pt-2 md:pt-4">
        {hero ? (
          <>
            <h2
              style={{
                fontFamily: S.barlow,
                fontWeight: 800,
                fontSize: "clamp(42px, 5vw, 64px)",
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: S.textPrimary,
              }}
            >
              {hero.title}
            </h2>
            <p
              className="mt-4"
              style={{
                fontFamily: S.barlow,
                fontWeight: 400,
                fontSize: "clamp(16px, 2vw, 18px)",
                color: S.textSecondary,
              }}
            >
              {hero.subtitle}
            </p>
          </>
        ) : (
          <>
            <h2
              style={{
                fontFamily: S.barlow,
                fontWeight: 800,
                fontSize: "clamp(42px, 5vw, 64px)",
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: S.textPrimary,
              }}
            >
              GOBIERNA LA RED
              <br />
              <span style={{ color: S.gold }}>11 CRACKS.</span>
            </h2>
            <p
              className="mt-4"
              style={{
                fontFamily: S.barlow,
                fontWeight: 400,
                fontSize: "clamp(16px, 2vw, 18px)",
                color: S.textSecondary,
              }}
            >
              Mantén la visión global sin perder el contexto de cada organización
            </p>
          </>
        )}
      </div>
    </div>
  );
}
