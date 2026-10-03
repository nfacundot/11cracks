"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { PlayerProgressFixture, PlayerProgressRacha, PlayerProgressRachaState, PlayerProgressSeries } from "@/lib/player/progress";
import { DataVizTooltip, useDataVizInteraction } from "@/components/shared/data-viz-interaction";
import { PlayerRpgProgressModules } from "@/components/player/player-rpg-progress-modules";

type ProgressMode = "sport" | "neurocracks";

const center = 100;
const radius = 76;

function pointsFor(values: readonly number[]) {
  return values.map((value, index) => {
    const angle = (-90 + index * (360 / values.length)) * (Math.PI / 180);
    const distance = radius * (value / 100);
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  }).join(" ");
}

function gridPoints(scale: number, count: number) {
  return pointsFor(Array.from({ length: count }, () => scale * 100));
}

function axisPoint(index: number, count: number) {
  const angle = (-90 + index * (360 / count)) * (Math.PI / 180);
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

function Radar({ series }: { series: PlayerProgressSeries }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { rootRef, activeId, activate } = useDataVizInteraction();
  const pointRefs = useMemo(() => Array.from({ length: 6 }, () => ({ current: null as HTMLButtonElement | null })), []);
  const selected = series.dimensions[selectedIndex];
  const delta = selected.current - selected.previous;
  const selectedDatum = { id: selected.id, label: selected.label, value: selected.current, secondary: `Anterior: ${selected.previous} / 100` };
  const accentClass = series.accent === "violet" ? "player-progress-radar--violet" : "player-progress-radar--cyan";
  return (
    <div ref={rootRef} className={`player-progress-radar ${accentClass}`}>
      <div className="player-progress-radar__chart">
        <svg viewBox="0 0 200 200" role="img" aria-label={`Radar de evolución de ${series.label}`}>
          <g className="player-progress-radar__grid" aria-hidden="true">
            {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPoints(scale, series.dimensions.length)} />)}
            {series.dimensions.map((_, index) => {
              const point = axisPoint(index, series.dimensions.length);
              return <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} />;
            })}
          </g>
          <polygon className="player-progress-radar__previous" points={pointsFor(series.dimensions.map((item) => item.previous))} />
          <polygon className="player-progress-radar__current" points={pointsFor(series.dimensions.map((item) => item.current))} />
          <circle cx={center} cy={center} r="3" className="player-progress-radar__center" aria-hidden="true" />
        </svg>
        {series.dimensions.map((dimension, index) => {
          const point = axisPoint(index, series.dimensions.length);
          return (
            <button
              key={dimension.id}
              type="button"
              className="player-progress-radar__point"
              ref={pointRefs[index]}
              data-selected={selectedIndex === index}
              style={{ "--point-x": `${point.x / 2}%`, "--point-y": `${point.y / 2}%` } as CSSProperties}
              aria-label={`${dimension.label}: ${dimension.current} de 100. Anterior: ${dimension.previous} de 100`}
              aria-pressed={selectedIndex === index}
              onClick={() => { setSelectedIndex(index); activate(dimension.id); }}
              onMouseEnter={() => { setSelectedIndex(index); activate(dimension.id); }}
              onFocus={() => { setSelectedIndex(index); activate(dimension.id); }}
            />
          );
        })}
      </div>
      <DataVizTooltip datum={selectedDatum} anchorRef={pointRefs[selectedIndex]} visible={activeId === selected.id} accent={series.accent === "violet" ? "var(--context-neurocracks)" : "var(--context-progress)"} />
      <div className="player-progress-radar__legend" aria-label="Leyenda del período">
        <span><i data-period="current" /> Hoy</span><span><i data-period="previous" /> Período anterior</span>
      </div>
      <aside className="player-progress-radar__detail" aria-live="polite">
        <small>{selected.label}</small>
        <div><strong>{selected.current}</strong><span>Actual</span></div>
        <div><strong>{selected.previous}</strong><span>Anterior</span></div>
        <em data-positive={delta >= 0}>{delta >= 0 ? "+" : ""}{delta} pts</em>
      </aside>
      <div className="player-progress-radar__dimensions" aria-label={`Dimensiones de ${series.label}`}>
        {series.dimensions.map((dimension, index) => <button key={dimension.id} type="button" aria-pressed={selectedIndex === index} onClick={() => { setSelectedIndex(index); activate(dimension.id); }}>{dimension.label}</button>)}
      </div>
    </div>
  );
}

function TrendChart({ values }: { values: PlayerProgressFixture["trend"] }) {
  const max = Math.max(...values.map((item) => item.value));
  const min = Math.min(...values.map((item) => item.value));
  const points = values.map((item, index) => `${(index / (values.length - 1)) * 100},${100 - ((item.value - min) / Math.max(1, max - min)) * 68 - 16}`).join(" ");
  return (
    <div className="player-progress-trend__chart">
      <svg viewBox="0 0 100 100" role="img" aria-label="Evolución de rendimiento durante el período">
        <path className="player-progress-trend__line" d={`M ${points.replaceAll(",", " ").replaceAll(" ", " ")}`} />
        <polyline points={points} className="player-progress-trend__polyline" />
      </svg>
      <div>{values.map((item) => <span key={item.label}>{item.label}</span>)}</div>
    </div>
  );
}

function formatRachaDate(value?: string): string { return value ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)).replace(".", "") : "Sin actividad validada"; }
function rachaStateLabel(state: PlayerProgressRachaState): string { return state === "ACTIVA" ? "Activa" : state === "INTERRUMPIDA" ? "Interrumpida" : "Sin racha"; }
function safePlayerText(value: string | undefined, fallback: string): string { return value && !/phase|e2e|fixture|qa|durable|test|raw enum/i.test(value) ? value : fallback; }

export function PlayerProgress({ fixture, racha }: { fixture: PlayerProgressFixture; racha?: PlayerProgressRacha }) {
  const [mode, setMode] = useState<ProgressMode>("sport");
  const series = fixture[mode];
  const validatedHours = fixture.hours.validated;
  const targetHours = fixture.hours.target;
  const hoursPercent = Math.round((validatedHours / targetHours) * 100);

  return <article className="player-progress-page" data-mode={mode}>
    <header className="player-progress-page__header">
      <div><span className="player-progress-page__eyebrow">PLAYER · ANÁLISIS PERSONAL</span><h1>Mi progreso</h1><p>Lee tu evolución y decide el siguiente foco de entrenamiento.</p></div>
    </header>

    {racha ? <section className="player-progress-racha" aria-labelledby="progress-racha-title"><div><span className="player-progress-page__eyebrow">CONTINUIDAD VERIFICADA</span><h2 id="progress-racha-title">Racha <small>{rachaStateLabel(racha.state)}</small></h2><p>{racha.explanation}</p>{racha.recentDays ? <div className="player-progress-racha__days" aria-label="Últimos 7 días de actividad validada">{racha.recentDays.map((day) => <span key={day.date} data-verified={day.verified} title={day.date} />)}</div> : null}{typeof racha.verifiedCount === "number" ? <p className="player-progress-racha__count">{racha.verifiedCount} días validados en los últimos 30</p> : null}</div><dl><div><dt>Actual</dt><dd>{racha.currentStreak === null ? "—" : `${racha.currentStreak} d`}</dd></div><div><dt>Mejor racha</dt><dd>{racha.bestStreak === null ? "—" : `${racha.bestStreak} d`}</dd></div><div><dt>Última actividad</dt><dd>{formatRachaDate(racha.lastVerifiedActivityDate)}</dd></div><div><dt>Próximo hito</dt><dd>{racha.nextMilestone ? `${racha.nextMilestone} d` : "—"}</dd></div></dl></section> : null}

    <PlayerRpgProgressModules rpg={fixture.rpg} />

    <section className="player-progress-page__hero" aria-labelledby="progress-evolution-title">
      <div className="player-progress-page__hero-copy"><span className="player-progress-page__eyebrow">VISIÓN DE RENDIMIENTO</span><h2 id="progress-evolution-title">Tu evolución</h2><p>Compara tu estado actual con tu período anterior.</p><div className="player-progress-page__tabs" role="group" aria-label="Seleccionar área de evolución"><button type="button" aria-pressed={mode === "sport"} onClick={() => setMode("sport")}>Deporte</button><button type="button" aria-pressed={mode === "neurocracks"} onClick={() => setMode("neurocracks")}>NeuroCracks</button></div></div>
      <Radar series={series} />
    </section>

    <section className="player-progress-page__metrics" aria-label="Indicadores clave">{fixture.indicators.map((item) => <div key={item.id}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></div>)}</section>

    <div className="player-progress-page__grid player-progress-page__grid--middle" data-priority="supporting">
      <section className="player-progress-panel player-progress-trend" aria-labelledby="progress-trend-title" aria-describedby="progress-trend-provenance" data-provenance="fixture-history"><div className="player-progress-panel__heading"><div><span className="player-progress-page__eyebrow">CAMBIO EN EL TIEMPO</span><h2 id="progress-trend-title">Evolución del período</h2></div><strong>{fixture.trend.at(-1)?.value} / 100</strong></div><p id="progress-trend-provenance" className="data-viz-sr-only">Visualización informativa. Los puntos mensuales no representan evaluaciones históricas almacenadas; sirven para mostrar la evolución del período.</p><TrendChart values={fixture.trend} /></section>
      <section className="player-progress-panel player-progress-list" aria-labelledby="progress-strength-title"><div className="player-progress-panel__heading"><div><span className="player-progress-page__eyebrow">LECTURA ACTUAL</span><h2 id="progress-strength-title">Fortalezas</h2></div></div>{fixture.strengths.map((item) => <div className="player-progress-list__item" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}<h3>Para mejorar</h3>{fixture.improve.map((item) => <div className="player-progress-list__item player-progress-list__item--improve" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}</section>
    </div>

    <div className="player-progress-page__grid player-progress-page__grid--lower" data-priority="supporting">
      <section className="player-progress-panel player-progress-coach" aria-labelledby="progress-coach-title"><span className="player-progress-page__eyebrow">SEGUIMIENTO</span><h2 id="progress-coach-title">Lo que dice tu entrenador</h2>{fixture.coachFeedback ? <><blockquote>“{safePlayerText(fixture.coachFeedback.message, "Sigue trabajando tu próximo objetivo.")}”</blockquote><p>Entrenador · {safePlayerText(fixture.coachFeedback.context, "Seguimiento reciente")} · {fixture.coachFeedback.dateLabel}</p><strong>{safePlayerText(fixture.coachFeedback.dimension, "Desarrollo técnico")}</strong></> : <p className="player-progress-coach__empty">Tu entrenador todavía no ha publicado una recomendación.</p>}</section>
      <section className="player-progress-panel player-progress-hours" aria-labelledby="progress-hours-title"><span className="player-progress-page__eyebrow">CERTIFICACIÓN · SOLO LECTURA</span><h2 id="progress-hours-title">Tu recorrido</h2><div className="player-progress-hours__number"><strong>{validatedHours}</strong><span>h validadas</span></div><div className="player-progress-hours__bar"><i style={{ width: `${hoursPercent}%` }} /></div><div className="player-progress-hours__meta"><span>{hoursPercent}% de {targetHours} h</span><strong>{Math.max(0, targetHours - validatedHours)} h por completar</strong></div><p>{fixture.hours.recent}</p></section>
    </div>

    <div className="player-progress-page__grid player-progress-page__grid--bottom" data-priority="supporting">
      <section className="player-progress-panel player-progress-bilingual" aria-labelledby="progress-bilingual-title" data-testid="player-language-progress"><span className="player-progress-page__eyebrow">NEUROCRACKS · FUENTE PERSISTIDA</span><h2 id="progress-bilingual-title">Bilingüismo Sport</h2><div className="player-progress-language-grid"><p>No hay actividad de idioma persistida para mostrar.</p></div></section>
      <section className="player-progress-panel player-progress-history" aria-labelledby="progress-history-title"><span className="player-progress-page__eyebrow">REGISTRO RECIENTE</span><h2 id="progress-history-title">Últimas evaluaciones</h2>{fixture.evaluations.map((item) => <div key={item.title + item.dateLabel}><strong>{item.title}</strong><span>{item.context}</span><time>{item.dateLabel}</time></div>)}</section>
    </div>
  </article>;
}