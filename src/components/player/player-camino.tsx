"use client";

import Link from "next/link";

const stages = [
  { id: "foundation", label: "Fundamentos", description: "Técnica básica, coordinación y juego en espacio reducido.", progress: 100, status: "completed" as const },
  { id: "development", label: "Desarrollo", description: "Táctica individual, toma de decisión y juego posicional.", progress: 72, status: "active" as const },
  { id: "performance", label: "Rendimiento", description: "Competencia de alto nivel, análisis de juego y liderazgo.", progress: 0, status: "locked" as const },
];

const milestones = [
  { id: "m-1", title: "Primer registro", description: "Completaste tu perfil y dimensión inicial.", done: true },
  { id: "m-2", title: "5 horas entrenadas", description: "Acumulaste 5 horas de entrenamiento verificadas.", done: true },
  { id: "m-3", title: "10 sesiones asistidas", description: "Asististe a 10 sesiones de entrenamiento.", done: true },
  { id: "m-4", title: "Primera evaluación", description: "Recibiste tu primera evaluación del entrenador.", done: false },
  { id: "m-5", title: "50 horas validadas", description: "Alcanza 50 horas de entrenamiento validadas.", done: false },
  { id: "m-6", title: "Certificación de etapa", description: "Completa la etapa de Desarrollo y avanza a Rendimiento.", done: false },
];

export function PlayerCamino() {
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const totalMilestones = milestones.filter((m) => m.done).length;
  return (
    <article className="player-camino-page">
      <header className="player-camino-page__header">
        <span className="player-camino-page__eyebrow">MI RECORRIDO</span>
        <h1>El Camino</h1>
        <p>Tu progresión dentro del programa 11 Cracks: etapas, hitos y certificaciones.</p>
      </header>

      <div className="player-camino__summary">
        <div><strong>{completedStages}</strong><span>etapas completadas</span></div>
        <div><strong>{totalMilestones}/{milestones.length}</strong><span>hitos alcanzados</span></div>
        <div><strong>{stages.find((s) => s.status === "active")?.label ?? "—"}</strong><span>etapa actual</span></div>
      </div>

      <section className="player-camino__stages" aria-labelledby="camino-stages-title">
        <div className="player-camino__section-heading">
          <div>
            <span className="player-camino-page__eyebrow">ETAPAS</span>
            <h2 id="camino-stages-title">Tu progresión</h2>
          </div>
        </div>
        <div className="player-camino__stage-list">
          {stages.map((stage, i) => (
            <article className="player-camino__stage" key={stage.id} data-status={stage.status}>
              <div className="player-camino__stage-head">
                <span className="player-camino__stage-number">{i + 1}</span>
                <div>
                  <strong>{stage.label}</strong>
                  <p>{stage.description}</p>
                </div>
              </div>
              <div className="player-camino__stage-bar">
                <div className="player-camino__progress" role="progressbar" aria-valuenow={stage.progress} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${stage.progress}%` }} />
                </div>
                <small>{stage.progress}%</small>
              </div>
              <span className="player-camino__stage-status">{stage.status === "completed" ? "Completada" : stage.status === "active" ? "En curso" : "Bloqueada"}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="player-camino__milestones" aria-labelledby="camino-milestones-title">
        <div className="player-camino__section-heading">
          <div>
            <span className="player-camino-page__eyebrow">HITOS</span>
            <h2 id="camino-milestones-title">Marcos del camino</h2>
          </div>
          <span>{totalMilestones} de {milestones.length}</span>
        </div>
        <div className="player-camino__milestone-list">
          {milestones.map((m) => (
            <article className="player-camino__milestone" key={m.id} data-done={m.done}>
              <div className="player-camino__milestone-check" aria-hidden="true">{m.done ? "✓" : ""}</div>
              <div>
                <strong>{m.title}</strong>
                <p>{m.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="player-camino__cta-section">
        <Link href="/jugador/progress">Ver mi progreso detallado <span aria-hidden="true">→</span></Link>
      </section>
    </article>
  );
}