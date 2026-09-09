"use client";

import { useState } from "react";

const dimensions = [
  { id: "dim-general", label: "GENERAL", score: 87 },
  { id: "dim-constancia", label: "CONSTANCIA", score: 84 },
  { id: "dim-formacion", label: "FORMACIÓN", score: 72 },
  { id: "dim-desarrollo", label: "DESARROLLO DEPORTIVO", score: 90 },
  { id: "dim-planeta", label: "PLANETA", score: 68 },
  { id: "dim-impacto", label: "IMPACTO SOCIAL", score: 81 },
];

const cards = [
  { title: "Racha de constancia", family: "CONSTANCIA · Semilla", progress: "80%" },
  { title: "Formación en idiomas", family: "FORMACIÓN · Reto", progress: "64%" },
  { title: "Planeta en juego", family: "PLANETA · Meta", progress: "52%" },
];

const benefits = ["FORMACIÓN", "IDIOMAS", "CERTIFICACIÓN"];

export function ClubRankingPanel() {
  const [activeId, setActiveId] = useState("dim-general");
  const active = dimensions.find((item) => item.id === activeId) ?? dimensions[0];

  return (
    <div className="admin-club-ranking-page">
      <div role="tablist" aria-label="Categoría de ranking" className="admin-club-ranking-dimensions">
        {dimensions.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={item.id === activeId}
            aria-controls="admin-club-ranking-panel"
            id={`${item.id}-tab`}
            className={item.id === activeId ? "is-active" : ""}
            onClick={() => setActiveId(item.id)}
            key={item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="admin-club-ranking-layout">
        <section className="admin-club-ranking-results" aria-label="Resultados del ranking">
          <div className="admin-club-ranking-section-heading"><div><p className="admin-club-ranking-kicker">RESULTADOS DEL PERÍODO</p><h2>1 con score disponible</h2><p className="admin-club-ranking-count-note">1 club registrado · 0 sin datos suficientes</p></div><span>Página 1 de 1</span></div>
          <div role="tabpanel" id="admin-club-ranking-panel" aria-labelledby={`${active.id}-tab`} className="admin-club-ranking-row-list">
            <article className="admin-club-ranking-row">
              <button type="button" className="admin-club-ranking-row__select">
                <span className="admin-club-ranking-row__rank">#1</span>
                <span className="admin-club-ranking-row__identity"><strong>Forjadores Pro</strong><small>En tu organización</small></span>
                <span className="admin-club-ranking-row__score"><small>{active.label}</small><strong>{active.score}</strong></span>
                <span className="admin-club-ranking-status">DATOS DISPONIBLES</span>
              </button>
            </article>
          </div>
          <div className="admin-club-ranking-pagination"><button type="button" disabled>← ANTERIOR</button><span>Página 1 de 1</span><button type="button" disabled>SIGUIENTE →</button></div>
          <p className="admin-note">Los totales de origen se muestran como contexto; no sustituyen la normalización del ranking. Asignación e inventario no creados en esta vista.</p>
        </section>
        <aside className="admin-club-ranking-detail" aria-label="Detalle del club">
          <div className="admin-club-ranking-detail__header"><p className="admin-club-ranking-kicker">DETALLE INMEDIATO</p><h2>Forjadores Pro</h2><p>Forjadores Pro · ESTE MES</p><div className="admin-club-ranking-detail__score"><span>CLUB SCORE</span><strong>{active.score}</strong><small>DATOS DISPONIBLES</small></div></div>
          <div className="admin-club-ranking-detail__ranks"><span><small>RANK GENERAL</small><strong>#1</strong></span><span><small>RANK CONSTANCIA</small><strong>#1</strong></span><span><small>RANK FORMACIÓN</small><strong>#1</strong></span></div>
          <section className="admin-club-ranking-detail__section"><div className="admin-club-ranking-section-heading"><h3>DESGLOSE DEL SCORE</h3><span>MODELO VIGENTE</span></div>
            {dimensions.map((item) => <div className={`admin-club-ranking-metric${item.id === activeId ? " is-active" : ""}`} key={item.id}><span><strong>{item.label}</strong><small>Métrica normalizada</small></span><strong>{item.score} / 100</strong></div>)}
          </section>
          <section className="admin-club-ranking-detail__section"><div className="admin-club-ranking-section-heading"><h3>LOGROS DEL CLUB</h3><span>3 activos</span></div>
            {cards.map((card) => <div className="admin-club-ranking-card-summary" key={card.title}><span><strong>{card.title}</strong><small>{card.family}</small></span><strong>{card.progress}</strong></div>)}
          </section>
          <section className="admin-club-ranking-detail__section"><h3>OPORTUNIDADES HABILITADAS</h3>
            {benefits.map((item) => <div className="admin-club-ranking-eligibility" key={item}><strong>{item}</strong><span>ELEGIBLE · disponibilidad pendiente</span></div>)}
          </section>
          <footer className="admin-club-ranking-detail__footer"><span>Calculado: 31 ago 2026</span><span>Asignación e inventario no creados en esta vista.</span></footer>
        </aside>
      </div>
    </div>
  );
}