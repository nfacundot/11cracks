"use client";

import Link from "next/link";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  context: "training" | "neurocracks";
  duration: string;
  completionPercent: number;
  status: "completed" | "in-progress" | "new";
  area: string;
}

const demoVideos: VideoItem[] = [
  { id: "v-1", title: "Recepción orientada", description: "Control del balón con apoyo visual y orientación corporal.", context: "training", duration: "6 min", completionPercent: 100, status: "completed", area: "Técnica" },
  { id: "v-2", title: "Pase en una dirección", description: "Pase preciso con imbalance defensivo.", context: "training", duration: "5 min", completionPercent: 60, status: "in-progress", area: "Táctica" },
  { id: "v-3", title: "Decisiones rápidas", description: "Ejercicio de velocidad mental para toma de decisión.", context: "neurocracks", duration: "4 min", completionPercent: 0, status: "new", area: "Neuro" },
  { id: "v-4", title: "Finta y paso", description: "Desplazamiento 1v1 con cambio de ritmo.", context: "training", duration: "7 min", completionPercent: 0, status: "new", area: "Individual" },
  { id: "v-5", title: "Atención distribuida", description: "Reto cognitivo de seguimiento múltiple.", context: "neurocracks", duration: "3 min", completionPercent: 35, status: "in-progress", area: "Neuro" },
  { id: "v-6", title: "Visión de juego", description: "Análisis de posicionamiento y reapertura de líneas.", context: "training", duration: "8 min", completionPercent: 100, status: "completed", area: "Colectiva" },
];

type Filter = "all" | "training" | "neurocracks" | "completed";

function actionLabel(v: VideoItem): string {
  if (v.status === "completed") return "COMPLETADO";
  if (v.status === "in-progress") return "CONTINUAR";
  return "EMPEZAR";
}

export function PlayerVideos() {
  const completed = demoVideos.filter((v) => v.status === "completed").length;
  return (
    <article className="player-videos-page">
      <header className="player-videos-page__header">
        <div>
          <span className="player-videos-page__eyebrow">DESARROLLO · VIDEO</span>
          <h1>Videos</h1>
          <p>Contenido aprobado para entrenar, aprender y retomar tu recorrido a tu ritmo.</p>
        </div>
        <div className="player-videos-page__summary">
          <strong>{completed}</strong>
          <span>completados</span>
        </div>
      </header>

      <div className="player-videos-page__filters" role="tablist" aria-label="Filtros de videos">
        <button role="tab" aria-selected="true" className="player-videos-page__filter" data-active="true">PARA MÍ</button>
        <button role="tab" aria-selected="false" className="player-videos-page__filter">ENTRENAMIENTO</button>
        <button role="tab" aria-selected="false" className="player-videos-page__filter">NEUROCRACKS</button>
        <button role="tab" aria-selected="false" className="player-videos-page__filter">COMPLETADOS</button>
      </div>

      <div className="player-videos-page__grid">
        {demoVideos.map((v) => (
          <article className="player-videos-page__card" key={v.id} data-status={v.status}>
            <div className="player-videos-page__thumb">
              <span aria-hidden="true">▶</span>
            </div>
            <div className="player-videos-page__card-body">
              <div className="player-videos-page__card-meta">
                <span>{v.context === "neurocracks" ? "NEUROCRACKS" : "ENTRENAMIENTO"}</span>
                <span>{v.duration}</span>
              </div>
              <h3>{v.title}</h3>
              <p>{v.description}</p>
              <div className="player-videos-page__card-facts">
                <span>{v.area}</span>
                <span>{v.completionPercent}% completado</span>
              </div>
              <Link className="player-videos-page__card-cta" href={`/jugador/videos`}>
                {actionLabel(v)} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}