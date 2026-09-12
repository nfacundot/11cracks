"use client";

import { useState } from "react";
// import { BilinguismoWelcome } from "@/components/player/bilinguisimo/bilinguismo-welcome"; // Deshabilitado: camino "Rumbo al Estadio" oculto en /jugador/neurocracks
import { ElCaminoLecciones } from "@/components/player/el-camino-lecciones";
import { estadisticasCamino, type ClaseCamino } from "@/lib/el-camino/lecciones";

type CaminoOption = {
  id: string;
  emoji: string;
  eyebrow: string;
  name: string;
  progressText: string;
  done: boolean;
  hasLessons: boolean;
};

/*
const BILINGUAL_OPTION: CaminoOption = {
  id: "bilingual",
  emoji: "🌍",
  eyebrow: "CAMINO 1 · IDIOMAS",
  name: "Rumbo al Estadio",
  progressText: "15 actividades de idioma",
  done: false,
};
*/

function buildOption(camino: ClaseCamino): CaminoOption {
  const stats = estadisticasCamino(camino);
  return {
    id: camino.id,
    emoji: camino.emoji,
    eyebrow: `MATERIA ${camino.order + 1}`,
    name: camino.name,
    progressText: stats.total === 0 ? "Sin lecciones todavía" : `${stats.completed}/${stats.total} lecciones`,
    done: stats.total > 0 && stats.completed === stats.total,
    hasLessons: camino.stages.some((stage) => stage.nodes.length > 0),
  };
}

export function ElCaminoHome({ playerId, caminos }: { playerId: string; caminos: ClaseCamino[] }) {
  // Comentado: el camino "Rumbo al Estadio" (Bilingüismo) ya no se ofrece aquí.
  // const options: CaminoOption[] = [BILINGUAL_OPTION, ...caminos.map(buildOption)];
  const options: CaminoOption[] = caminos.map(buildOption);
  // Altera la materia pendiente: la primera con lecciones y sin completar, así no
  // es necesario saltar entre materias manualmente (orden estricto).
  const [activeId, setActiveId] = useState<string>(
    () =>
      options.find((option) => !option.done && option.hasLessons)?.id ??
      options.find((option) => !option.done)?.id ??
      options[0]?.id ??
      ""
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const active = options.find((option) => option.id === activeId) ?? options[0] ?? null;
  const activeCamino = caminos.find((camino) => camino.id === activeId) ?? null;

  return (
    <div className="el-camino-home" data-testid="el-camino-home">
      {active && (
      <div className="el-camino__paths">
        <span className="el-camino__paths-label">SELECCIONA TU CAMINO</span>
        <div className="el-camino__paths-trigger">
          <button
            type="button"
            className="el-camino__paths-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="el-camino__paths-emoji">{active.emoji}</span>
            <span className="el-camino__paths-copy"><small>{active.eyebrow}</small><strong>{active.name}</strong><span>{active.progressText}</span></span>
            <span className="el-camino__paths-chevron" aria-hidden="true">{menuOpen ? "▲" : "▼"}</span>
          </button>
          {menuOpen ? (
            <div className="el-camino__paths-menu" role="menu" aria-label="Caminos disponibles">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option.id === activeId}
                  data-selected={option.id === activeId}
                  onClick={() => {
                    setActiveId(option.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="el-camino__paths-emoji">{option.emoji}</span>
                  <span className="el-camino__paths-copy"><small>{option.eyebrow}</small><strong>{option.name}</strong><span>{option.progressText}</span></span>
                  {option.done ? <span className="el-camino__paths-done">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      )}

      {menuOpen ? <button type="button" className="el-camino__paths-backdrop" aria-label="Cerrar selector" onClick={() => setMenuOpen(false)} /> : null}

      {activeCamino ? (
        <ElCaminoLecciones key={activeCamino.id} camino={activeCamino} playerId={playerId} />
      ) : null}
      {/*
      Camino "Rumbo al Estadio" (Bilingüismo) deshabilitado en /jugador/neurocracks:
      {activeId === BILINGUAL_OPTION.id ? (
        <BilinguismoWelcome playerId={playerId} />
      ) : null}
      */}
    </div>
  );
}