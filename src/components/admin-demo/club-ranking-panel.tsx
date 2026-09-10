"use client";

import { useMemo, useState } from "react";

export const clubRankingDimensions = [
  { id: "general", label: "GENERAL" },
  { id: "constancia", label: "CONSTANCIA" },
  { id: "formacion", label: "FORMACIÓN" },
  { id: "desarrollo", label: "DESARROLLO DEPORTIVO" },
  { id: "planeta", label: "PLANETA" },
  { id: "impacto", label: "IMPACTO SOCIAL" },
] as const;

export type ClubRankingDimensionId = (typeof clubRankingDimensions)[number]["id"];

export interface ClubRankingClub {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  members: number;
  activeMembers: number;
  score: Record<ClubRankingDimensionId, number>;
  hasData: boolean;
}

export interface ClubRankingPanelProps {
  clubs: ClubRankingClub[];
  ranked: ClubRankingClub[];
  rankByClub: Map<string, { general: number; constancia: number; formacion: number }>;
  withScore: number;
  clubCount: number;
  lessonTotal: number;
}

function clubStatus(club: ClubRankingClub): "DATOS DISPONIBLES" | "SIN DATOS SUFICIENTES" {
  return club.hasData ? "DATOS DISPONIBLES" : "SIN DATOS SUFICIENTES";
}

function achievementCards(club: ClubRankingClub) {
  const cards: { title: string; family: string; progress: string; value: number }[] = [];
  cards.push({
    title: "Racha de constancia",
    family: "CONSTANCIA · Semilla",
    progress: `${club.score.constancia}%`,
    value: club.score.constancia,
  });
  cards.push({
    title: "Formación en idiomas",
    family: "FORMACIÓN · Reto",
    progress: `${club.score.formacion}%`,
    value: club.score.formacion,
  });
  cards.push({
    title: "Planeta en juego",
    family: "PLANETA · Meta",
    progress: `${club.score.planeta}%`,
    value: club.score.planeta,
  });
  return cards;
}

export function ClubRankingPanel({
  clubs,
  ranked,
  rankByClub,
  withScore,
  clubCount,
  lessonTotal,
}: ClubRankingPanelProps) {
  const [activeId, setActiveId] = useState<ClubRankingDimensionId>("general");
  const activeLabel = clubRankingDimensions.find((item) => item.id === activeId)?.label ?? "GENERAL";

  const visible = clubCount > 0 ? ranked : [];
  const selected = useMemo(
    () => ranked.find((club) => club.hasData) ?? ranked[0] ?? null,
    [ranked],
  );

  if (clubCount === 0) {
    return (
      <div className="admin-club-ranking-page">
        <div className="admin-club-ranking-dimensions">
          {clubRankingDimensions.map((item) => (
            <button key={item.id} type="button" aria-disabled className={item.id === activeId ? "is-active" : ""}>
              {item.label}
            </button>
          ))}
        </div>
        <section className="admin-panel">
          <h2>Ranking de clubes</h2>
          <p className="admin-note">Aún no hay clubes registrados para calcular un ranking de progresión.</p>
        </section>
      </div>
    );
  }

  const ranks = selected ? rankByClub.get(selected.id) ?? { general: 0, constancia: 0, formacion: 0 } : { general: 0, constancia: 0, formacion: 0 };

  return (
    <div className="admin-club-ranking-page">
      <div role="tablist" aria-label="Categoría de ranking" className="admin-club-ranking-dimensions">
        {clubRankingDimensions.map((item) => (
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
          <div className="admin-club-ranking-section-heading"><div><p className="admin-club-ranking-kicker">RESULTADOS DEL PERÍODO</p><h2>{withScore} con score disponible</h2><p className="admin-club-ranking-count-note">{clubCount} club registrados · {Math.max(0, clubCount - withScore)} sin datos suficientes</p></div><span>Página 1 de 1</span></div>
          <div role="tabpanel" id="admin-club-ranking-panel" aria-labelledby={`${activeId}-tab`} className="admin-club-ranking-row-list">
            {visible.map((club, index) => (
              <article className="admin-club-ranking-row" key={club.id}>
                <button type="button" className="admin-club-ranking-row__select">
                  <span className="admin-club-ranking-row__rank">#{index + 1}</span>
                  <span className="admin-club-ranking-row__identity"><strong>{club.name}</strong><small>{club.members} miembro(s) · {club.activeMembers} activos</small></span>
                  <span className="admin-club-ranking-row__score"><small>{activeLabel}</small><strong>{club.score[activeId]}</strong></span>
                  <span className="admin-club-ranking-status">{clubStatus(club)}</span>
                </button>
              </article>
            ))}
          </div>
          <div className="admin-club-ranking-pagination"><button type="button" disabled>← ANTERIOR</button><span>Página 1 de 1</span><button type="button" disabled>SIGUIENTE →</button></div>
          <p className="admin-note">Los totales de origen se muestran como contexto; no sustituyen la normalización del ranking. Asignación e inventario no creados en esta vista.</p>
        </section>
        <aside className="admin-club-ranking-detail" aria-label="Detalle del club">
          {selected ? (
            <>
              <div className="admin-club-ranking-detail__header"><p className="admin-club-ranking-kicker">DETALLE INMEDIATO</p><h2>{selected.name}</h2><p>{selected.name} · ESTE MES</p><div className="admin-club-ranking-detail__score"><span>CLUB SCORE</span><strong>{selected.score.general}</strong><small>{clubStatus(selected)}</small></div></div>
              <div className="admin-club-ranking-detail__ranks"><span><small>RANK GENERAL</small><strong>#{ranks.general}</strong></span><span><small>RANK CONSTANCIA</small><strong>#{ranks.constancia}</strong></span><span><small>RANK FORMACIÓN</small><strong>#{ranks.formacion}</strong></span></div>
              <section className="admin-club-ranking-detail__section"><div className="admin-club-ranking-section-heading"><h3>DESGLOSE DEL SCORE</h3><span>MODELO VIGENTE</span></div>
                {clubRankingDimensions.map((item) => <div className={`admin-club-ranking-metric${item.id === activeId ? " is-active" : ""}`} key={item.id}><span><strong>{item.label}</strong><small>Métrica normalizada</small></span><strong>{selected.score[item.id]} / 100</strong></div>)}
              </section>
              <section className="admin-club-ranking-detail__section"><div className="admin-club-ranking-section-heading"><h3>LOGROS DEL CLUB</h3><span>{achievementCards(selected).filter((card) => card.value >= 50).length} activos</span></div>
                {achievementCards(selected).map((card) => <div className="admin-club-ranking-card-summary" key={card.title}><span><strong>{card.title}</strong><small>{card.family}</small></span><strong>{card.progress}</strong></div>)}
              </section>
              <section className="admin-club-ranking-detail__section"><h3>OPORTUNIDADES HABILITADAS</h3>
                {selected.score.formacion >= 50 ? <div className="admin-club-ranking-eligibility"><strong>FORMACIÓN</strong><span>ELEGIBLE · disponibilidad pendiente</span></div> : null}
                {selected.score.constancia >= 50 ? <div className="admin-club-ranking-eligibility"><strong>IDIOMAS</strong><span>ELEGIBLE · disponibilidad pendiente</span></div> : null}
                {selected.score.general >= 60 ? <div className="admin-club-ranking-eligibility"><strong>CERTIFICACIÓN</strong><span>ELEGIBLE · disponibilidad pendiente</span></div> : null}
              </section>
              <footer className="admin-club-ranking-detail__footer"><span>Basado en {lessonTotal} lecciones del catálogo</span><span>Asignación e inventario no creados en esta vista.</span></footer>
            </>
          ) : (
            <section className="admin-panel">
              <h2>Detalle del club</h2>
              <p className="admin-note">Selecciona un club para ver su desglose.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}