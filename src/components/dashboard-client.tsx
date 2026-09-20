"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Trophy,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesColumn,
  KeyRound,
  BookOpen,
} from "lucide-react";

const D = {
  hero: {
    title1: "TU PARTIDO",
    title2: "EMPIEZA AQUÍ.",
    subtitle: "Entrena, aprende y sigue construyendo tu camino.",
  },
  nextStep: {
    eyebrow: "TU SIGUIENTE PASO",
    title: "Continúa Bilingüismo Sport",
    description: "Retoma donde quedaste.",
  },
  nextTraining: {
    eyebrow: "PRÓXIMO ENTRENAMIENTO",
    date: "Martes, 25 de agosto",
    time: "5:30 PM",
    location: "Cancha principal · Forjadores Pro",
  },
  stats: [
    { label: "ASISTENCIA", value: "92%", suffix: "", icon: CalendarCheck },
    { label: "CONSISTENCIA", value: "4", suffix: "días", icon: Trophy },
    { label: "HORAS VALIDADAS", value: "126", suffix: "/ 540 h", icon: ChartNoAxesColumnIncreasing },
  ],
  nav: [
    { label: "MI PROGRESO", href: "/jugador/learn", color: "#00CFE8", icon: ChartNoAxesColumn },
    { label: "ENTRENAMIENTO", href: "/jugador/training", color: "#C89B32", icon: KeyRound },
    { label: "NEUROCRACKS", href: "/jugador/games", color: "#B35CFF", icon: BookOpen },
  ],
};

const S = {
  barlow: 'var(--font-barlow), "Barlow Condensed", sans-serif',
  bg: "var(--surface-canvas)",
  surface: "var(--surface-panel)",
  surfaceAlt: "var(--surface-elevated)",
  border: "var(--border-subtle)",
  borderSubtle: "var(--border-subtle)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  accent: "var(--action-energy)",
  accentHover: "var(--action-energy-hover)",
  gold: "var(--brand-gold-bright)",
  cyan: "#00CFE8",
  purple: "#B35CFF",
};

function DashboardHero() {
  return (
    <div className="px-6 pt-8 pb-2 md:px-10 md:pt-10 md:pb-2">
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
          {D.hero.title1}
          <br />
          {D.hero.title2}
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
          {D.hero.subtitle}
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:gap-4">
          <div
            className="flex overflow-hidden md:flex-[65]"
            style={{
              height: 140,
              borderRadius: 14,
              border: `1px solid ${S.border}`,
              background: S.surfaceAlt,
            }}
          >
            <div
              className="flex flex-1 flex-col justify-center"
              style={{ padding: "20px 20px 20px 28px" }}
            >
              <span
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.accent,
                }}
              >
                {D.nextStep.eyebrow}
              </span>
              <h3
                className="mt-2"
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 700,
                  fontSize: 28,
                  lineHeight: 1,
                  color: S.textPrimary,
                }}
              >
                {D.nextStep.title}
              </h3>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 400,
                  fontSize: 15,
                  color: S.textSecondary,
                }}
              >
                {D.nextStep.description}
              </p>
            </div>

            <button
              type="button"
              aria-label="Continuar entrenamiento"
              className="flex items-center justify-center gap-5"
              style={{
                flex: "0 0 30%",
                background: S.accent,
                color: S.bg,
                fontFamily: S.barlow,
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer",
                transition: "background 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = S.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = S.accent;
              }}
            >
              CONTINUAR
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div
            className="flex items-center gap-4 px-5 md:flex-[35]"
            style={{
              height: 140,
              borderRadius: 14,
              border: `1px solid ${S.border}`,
              background: S.surfaceAlt,
            }}
          >
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center"
              style={{
                borderRadius: "50%",
                border: "1px solid rgba(200,155,50,0.45)",
                background: "rgba(200,155,50,0.03)",
              }}
            >
              <CalendarDays size={19} style={{ color: S.gold }} />
            </div>

            <div className="flex flex-col">
              <span
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.gold,
                }}
              >
                {D.nextTraining.eyebrow}
              </span>
              <span
                className="mt-1.5"
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 400,
                  fontSize: 13,
                  color: S.textSecondary,
                }}
              >
                {D.nextTraining.date}
              </span>
              <span
                className="mt-0.5"
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 700,
                  fontSize: 26,
                  lineHeight: 1.1,
                  color: S.textPrimary,
                }}
              >
                {D.nextTraining.time}
              </span>
              <span
                className="mt-1"
                style={{
                  fontFamily: S.barlow,
                  fontWeight: 400,
                  fontSize: 12,
                  color: S.textMuted,
                }}
              >
                {D.nextTraining.location}
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-stretch mt-4"
          style={{
            height: 80,
            background: S.surfaceAlt,
            borderRadius: 12,
            border: `1px solid ${S.border}`,
          }}
        >
          {D.stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="contents">
                {i > 0 && (
                  <div
                    className="shrink-0"
                    style={{ width: 1, background: S.border }}
                  />
                )}
                <div className="flex flex-1 items-center gap-3 px-4 md:px-5">
                  <div
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center"
                    style={{
                      borderRadius: "50%",
                      border: "1px solid rgba(200,155,50,0.45)",
                    }}
                  >
                    <Icon size={17} style={{ color: S.gold }} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span
                      className="truncate uppercase"
                      style={{
                        fontFamily: S.barlow,
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        color: S.textMuted,
                      }}
                    >
                      {stat.label}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        style={{
                          fontFamily: S.barlow,
                          fontWeight: 700,
                          fontSize: 26,
                          lineHeight: 1.15,
                          color: S.textPrimary,
                        }}
                      >
                        {stat.value}
                      </span>
                      {stat.suffix && (
                        <span
                          style={{
                            fontFamily: S.barlow,
                            fontWeight: 400,
                            fontSize: 13,
                            color: S.textSecondary,
                          }}
                        >
                          {stat.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
          {D.nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 px-4"
                style={{
                  height: 48,
                  flex: 1,
                  background: S.surface,
                  border: `1px solid ${S.borderSubtle}`,
                  borderBottom: `2px solid ${item.color}`,
                  borderRadius: 12,
                  transition: "all 180ms ease",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `1px solid ${item.color}`;
                  e.currentTarget.style.outlineOffset = "2px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = "none";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.background = S.surfaceAlt;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = S.surface;
                }}
              >
                <Icon size={17} style={{ color: item.color }} />
                <span
                  className="flex-1 uppercase"
                  style={{
                    fontFamily: S.barlow,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    color: S.textPrimary,
                  }}
                >
                  {item.label}
                </span>
                <ArrowRight
                  size={15}
                  style={{
                    color: item.color,
                    transition: "transform 180ms ease",
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
  );
}


export function DashboardClient() {
  return (
    <section className="flex flex-col" style={{ gap: 16, marginTop: 20 }}>
      <DashboardHero />
    </section>
  );
}
