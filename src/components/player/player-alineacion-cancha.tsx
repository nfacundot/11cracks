"use client";

import { useState, type ReactNode } from "react";

export function PlayerAlineacionCancha({ children }: { children: ReactNode }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div
      className={
        expandido
          ? "player-alineacion-cancha player-alineacion-cancha--expandido"
          : "player-alineacion-cancha"
      }
    >
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
        aria-label={expandido ? "Cerrar cancha ampliada" : "Ampliar cancha"}
        title={expandido ? "Cerrar cancha ampliada" : "Ampliar cancha"}
        className="player-alineacion-cancha__toggle"
      >
        <span aria-hidden>{expandido ? "✕" : "⛶"}</span>
      </button>
      {children}
    </div>
  );
}