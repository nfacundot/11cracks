"use client";

import { useState } from "react";

export type PlayerAlineacionRosterItem = {
  id: string;
  name: string;
  codigo: string | null;
  isCurrent: boolean;
};

const POSITION_LABELS: Record<string, string> = {
  POR: "Portero",
  LD: "Lateral Derecho",
  DFC: "Defensa Central",
  LI: "Lateral Izquierdo",
  MCD: "Pivote Defensivo",
  MC: "Mediocentro",
  MCO: "Mediapunta",
  ED: "Extremo Derecho",
  EI: "Extremo Izquierdo",
  DC: "Delantero Centro",
  SD: "Segundo Delantero",
};

function PlayerList({ players, label }: { players: readonly PlayerAlineacionRosterItem[]; label: string }) {
  const listId = `player-alineacion-roster-${label.toLowerCase()}`;
  return (
    <section className="player-alineacion__list" aria-labelledby={listId}>
      <div className="player-alineacion__section-heading">
        <h3 id={listId}>{label}</h3>
        <span>{players.length} jugadores</span>
      </div>
      <div className="player-alineacion__list-items">
        {players.map((player) => (
          <div
            className="player-alineacion__list-item"
            data-current={player.isCurrent ? "true" : "false"}
            key={player.id}
          >
            <strong>{player.codigo ?? "—"}</strong>
            <span>
              <b>{player.name}</b>
              <small>
                {player.codigo ? `${POSITION_LABELS[player.codigo] ?? player.codigo} · ${player.codigo}` : "Sin posición"}
              </small>
            </span>
            {player.isCurrent ? <em>Tu posición</em> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlayerAlineacionRoster({
  starters,
  substitutes,
}: {
  starters: readonly PlayerAlineacionRosterItem[];
  substitutes: readonly PlayerAlineacionRosterItem[];
}) {
  const [rosterTab, setRosterTab] = useState<"starters" | "substitutes">("starters");
  return (
    <section className="player-alineacion__roster" data-roster-tab={rosterTab} aria-labelledby="player-alineacion-roster-title">
      <div className="player-alineacion__roster-heading">
        <div>
          <span className="player-alineacion-page__eyebrow">PLANTILLA</span>
          <h2 id="player-alineacion-roster-title">Plantilla de esta alineación</h2>
        </div>
        <div className="player-alineacion__roster-tabs" role="tablist" aria-label="Plantilla de esta alineación">
          <button
            type="button"
            role="tab"
            aria-selected={rosterTab === "starters"}
            onClick={() => setRosterTab("starters")}
          >
            Titulares <span>({starters.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={rosterTab === "substitutes"}
            onClick={() => setRosterTab("substitutes")}
          >
            Suplentes <span>({substitutes.length})</span>
          </button>
        </div>
      </div>
      <div className="player-alineacion__roster-panels">
        <div data-roster-panel="starters">
          <PlayerList players={starters} label="Titulares" />
        </div>
        <div data-roster-panel="substitutes">
          <PlayerList players={substitutes} label="Suplentes" />
        </div>
      </div>
    </section>
  );
}