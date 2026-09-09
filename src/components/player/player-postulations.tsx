"use client";

const labels: Record<string, string> = {
  DRAFT: "Borrador guardado",
  SUBMITTED: "Postulación enviada",
  CONFIRMED: "Recepción confirmada",
  IN_REVIEW: "En revisión",
  SELECTED: "Seleccionado",
  REJECTED: "No seleccionado",
};

const demoPostulations = [
  { id: "p-1", opportunity: "Beca Rendimiento 2026", state: "IN_REVIEW", updatedAt: "24 ago 2026" },
  { id: "p-2", opportunity: "Torneo Regional U-17", state: "CONFIRMED", updatedAt: "18 ago 2026" },
  { id: "p-3", opportunity: "Programa de Verano", state: "SELECTED", updatedAt: "01 ago 2026" },
];

const demoOpportunities = [
  { id: "o-1", name: "Beca Rendimiento 2026", club: "11 Cracks", deadline: "30 sep 2026", status: "open" as const },
  { id: "o-2", name: "Torneo Nacional Interclubes", club: "11 Cracks", deadline: "15 oct 2026", status: "open" as const },
  { id: "o-3", name: "Copa Municipal U-17", club: "11 Cracks", deadline: "20 nov 2026", status: "open" as const },
];

function stateBadge(state: string) {
  const tone = state === "SELECTED" || state === "CONFIRMED" ? "success" : state === "REJECTED" ? "warning" : "neutral";
  return <span className="player-postulations__badge" data-tone={tone}>{labels[state] ?? state}</span>;
}

export function PlayerPostulations() {
  return (
    <article className="player-postulations-page">
      <header className="player-postulations-page__header">
        <span className="player-postulations-page__eyebrow">MI RECORRIDO · OPORTUNIDADES</span>
        <h1>Mis postulaciones</h1>
        <p>Consulta el estado de tus postulaciones y descubre nuevas oportunidades.</p>
      </header>

      <section className="player-postulations__panel" aria-labelledby="postulations-status-title">
        <div className="player-postulations__section-heading">
          <div>
            <span className="player-postulations-page__eyebrow">ESTADO</span>
            <h2 id="postulations-status-title">Mis postulaciones</h2>
          </div>
          <span>{demoPostulations.length} activas</span>
        </div>
        <div className="player-postulations__list">
          {demoPostulations.map((p) => (
            <article className="player-postulations__record" key={p.id}>
              <div>
                <strong>{p.opportunity}</strong>
                <small>Actualizado {p.updatedAt}</small>
              </div>
              {stateBadge(p.state)}
            </article>
          ))}
        </div>
      </section>

      <section className="player-postulations__panel" aria-labelledby="postulations-available-title">
        <div className="player-postulations__section-heading">
          <div>
            <span className="player-postulations-page__eyebrow">OPORTUNIDADES</span>
            <h2 id="postulations-available-title">Disponibles</h2>
          </div>
          <span>{demoOpportunities.length} abiertas</span>
        </div>
        <div className="player-postulations__list">
          {demoOpportunities.map((o) => (
            <article className="player-postulations__record" key={o.id}>
              <div>
                <strong>{o.name}</strong>
                <small>{o.club} · Cierre {o.deadline}</small>
              </div>
              <span className="player-postulations__badge" data-tone="success">Abierta</span>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}