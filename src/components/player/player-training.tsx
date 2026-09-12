"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PlayerTrainingFixture } from "@/lib/player/training";

function safeText(value: string | undefined, fallback: string): string {
  return value && !/phase|e2e|fixture|qa|durable|test|raw enum/i.test(value) ? value : fallback;
}

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return <span className="player-training__status" data-tone={tone}>{children}</span>;
}

export function PlayerTraining({ fixture }: { fixture: PlayerTrainingFixture }) {
  const next = fixture.nextTraining;
  return (
    <article className="player-training-page">
      <header className="player-training-page__header">
        <span className="player-training-page__eyebrow">PLAYER · OPERACIÓN DEPORTIVA</span>
        <h1>Entrenamiento</h1>
        <p>Organiza tu semana y llega con claridad a la próxima sesión.</p>
      </header>

      <section className="player-training__next" data-training-state={next ? "upcoming" : "empty"} aria-labelledby="training-next-title">
        {next ? (
          <>
            <div className="player-training__next-copy">
              <span className="player-training-page__eyebrow">PRÓXIMO ENTRENAMIENTO</span>
              <h2 id="training-next-title">{safeText(next.sessionType, "Sesión de entrenamiento")}</h2>
              <p>{safeText(next.location, "Ubicación por confirmar")}</p>
              <strong>{next.dateLabel}</strong>
              <time dateTime={next.startsAt}>{next.timeLabel}</time>
            </div>
            <div className="player-training__next-meta">
              <StatusPill tone="success">Confirmado</StatusPill>
              <span>{safeText(next.context, "11 Cracks")}</span>
              <small>Sesión de campo · {safeText(next.location, "Ubicación por confirmar")}</small>
            </div>
          </>
        ) : (
          <div className="player-training__next-empty">
            <span className="player-training-page__eyebrow">PRÓXIMO ENTRENAMIENTO</span>
            <h2 id="training-next-title">No hay una próxima sesión</h2>
            <p>Las sesiones anteriores siguen disponibles en tu historial.</p>
          </div>
        )}
      </section>

      <div className="player-training__top-grid">
        <section className="player-training-panel player-training__coach" aria-labelledby="training-coach-title">
          <span className="player-training-page__eyebrow">SEGUIMIENTO</span>
          <h2 id="training-coach-title">Foco del entrenador</h2>
          {fixture.coachFocus ? (
            <>
              <blockquote>&ldquo;{safeText(fixture.coachFocus.message, "Sigue trabajando tu próximo objetivo.")}&rdquo;</blockquote>
              <p>{safeText(fixture.coachFocus.context, "Seguimiento reciente")} · {fixture.coachFocus.dateLabel}</p>
              <strong>{safeText(fixture.coachFocus.dimension, "Desarrollo técnico")}</strong>
            </>
          ) : (
            <p className="player-training__coach-empty">Tu entrenador todavía no ha publicado un foco.</p>
          )}
        </section>

        <section className="player-training-panel player-training__recommendation" aria-labelledby="training-recommendation-title">
          <span className="player-training-page__eyebrow">CONTENIDO RECOMENDADO</span>
          <h2 id="training-recommendation-title">Para mejorar</h2>
          <strong>{safeText(fixture.recommendation.title, "Actividad recomendada")}</strong>
          <p>{safeText(fixture.recommendation.description, "Contenido para continuar tu formación.")} · {safeText(fixture.recommendation.duration, "Duración por confirmar")}</p>
          <StatusPill tone="warning">{fixture.recommendation.status === "pending" ? "Pendiente" : fixture.recommendation.status === "in-progress" ? "En progreso" : "Completado"}</StatusPill>
          <Link href="/jugador/videos?filter=training">Ver videos de entrenamiento <span aria-hidden="true">→</span></Link>
        </section>
      </div>

      <section className="player-training-panel player-training__week" aria-labelledby="training-week-title">
        <div className="player-training-panel__heading">
          <div>
            <span className="player-training-page__eyebrow">AGENDA</span>
            <h2 id="training-week-title">Mi semana</h2>
          </div>
          <span>Sesiones programadas</span>
        </div>
        <div className="player-training__week-list">
          {fixture.week.map((item) => (
            <div key={item.id} data-status={item.status}>
              <time>{item.dayLabel}<small>{item.dateLabel}</small></time>
              <div>
                <strong>{safeText(item.title, "Sesión de entrenamiento")}</strong>
                <span>{item.timeLabel} · {safeText(item.location, "Ubicación por confirmar")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="player-training__bottom-grid">
        <section className="player-training-panel player-training__sessions" aria-labelledby="training-sessions-title">
          <div className="player-training-panel__heading">
            <div>
              <span className="player-training-page__eyebrow">HISTORIAL</span>
              <h2 id="training-sessions-title">Últimas sesiones</h2>
            </div>
          </div>
          {fixture.sessions.map((session) => (
            <div className="player-training__session" key={session.id}>
              <time>{session.dateLabel}</time>
              <div>
                <strong>{session.title}</strong>
                <span>{session.attendance} · {session.hours} h</span>
              </div>
              <StatusPill tone={session.validation === "Validadas" ? "success" : "warning"}>{session.validation}</StatusPill>
            </div>
          ))}
        </section>

        <section className="player-training-panel player-training__hours" aria-labelledby="training-hours-title">
          <span className="player-training-page__eyebrow">REGISTRO</span>
          <h2 id="training-hours-title">Horas</h2>
          <div className="player-training__hours-stats">
            <div><strong>{fixture.hours.registered} h</strong><span>realizadas este mes</span></div>
            <div><strong>{fixture.hours.validated} h</strong><span>validadas este mes</span></div>
            <div><strong>{fixture.hours.pending} h</strong><span>pendientes</span></div>
          </div>
          <p>{fixture.hours.totalValidated} h validadas en total · objetivo {fixture.hours.target} h.</p>
          <Link href="/jugador/progress">Ver mi progreso <span aria-hidden="true">→</span></Link>
        </section>
      </div>
    </article>
  );
}