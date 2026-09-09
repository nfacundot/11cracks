"use client";

import Link from "next/link";

const ACTIONS = [
  { href: "/coach/equipo", label: "Abrir plantel" },
  { href: "/coach/evaluaciones", label: "Evaluar jugador" },
  { href: "/coach/cancha", label: "Abrir cancha" },
];

type CoachDashboardViewProps = {
  clubName?: string;
  publicado?: boolean;
};

export function CoachDashboardView({
  clubName = "Forjadores Pro",
  publicado = false,
}: CoachDashboardViewProps) {
  return (
    <div className="coach-home">
      <header className="coach-home__header">
        <span>COACH · {clubName}</span>
        <h1>Dashboard</h1>
        <p>Lo importante de tu equipo, hoy.</p>
      </header>

      <div className="coach-home__dashboard">
        {/* ─── Panel 1: Mi desarrollo y mi club ─── */}
        <section className="coach-home__progression" aria-label="Mi desarrollo y mi club">
          <div className="coach-home__progression-heading">
            <div>
              <span className="coach-home__progression-eyebrow">COACH · PROGRESIÓN</span>
              <h2>
                Mi desarrollo <em>y</em> mi club
              </h2>
              <p>Tu progreso profesional permanece separado del progreso institucional.</p>
            </div>
            <strong className="coach-home__progression-score">SIN DATOS</strong>
          </div>
          <div className="coach-home__progression-split">
            <div>
              <span>Mis cartas</span>
              <b>Datos insuficientes</b>
            </div>
            <div>
              <span>Mi club · {clubName}</span>
              <b>DATOS INSUFICIENTES</b>
              <small>Aún no hay cartas institucionales desbloqueadas</small>
            </div>
          </div>
        </section>

        {/* ─── Panel 2: Próximo entrenamiento ─── */}
        <section className="coach-home__panel" data-tone="lime">
          <div className="coach-home__panel-heading">
            <h2>Próximo entrenamiento</h2>
          </div>
          <strong className="coach-home__big-number">Martes · 5:30 PM</strong>
          <p>Cancha principal · Técnica + definición</p>
          <Link href="/coach/asistencia">Gestionar asistencia →</Link>
        </section>

        {/* ─── Panel 2: Atención prioritaria ─── */}
        <section className="coach-home__panel" data-tone="gold">
          <div className="coach-home__panel-heading">
            <h2>Atención prioritaria</h2>
          </div>
          <ul className="coach-home__list">
            <li>2 horas requieren validación</li>
            <li>6 jugadores requieren seguimiento de asistencia</li>
            <li>{publicado ? "Alineación publicada" : "Alineación pendiente de publicar"}</li>
          </ul>
        </section>

        {/* ─── Panel 4: Acciones rápidas ─── */}
        <section className="coach-home__panel">
          <div className="coach-home__panel-heading">
            <h2>Acciones rápidas</h2>
          </div>
          <div className="coach-home__actions">
            {ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}