"use client";

import { useEffect, useState } from "react";
import { CanchaView, type CanchaPlayer } from "@/components/admin/sections/cancha-view";
import { PlayerAlineacionRoster, type PlayerAlineacionRosterItem } from "@/components/player/player-alineacion-roster";
import { PlayerAlineacionCancha } from "@/components/player/player-alineacion-cancha";

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

const POSITION_GUIDE: Record<string, string[]> = {
  POR: ["Protege tu arco y sal con decisión.", "Inicia el juego con pases seguros.", "Ordena y comunica a la defensa."],
  DFC: ["Mantén la línea defensiva y cubre el área.", "Anticipa los pases filtrados.", "Sal a los balones aéreos."],
  LD: ["Sube por tu banda y vuelve a defender.", "Centra con calidad al llegar al fondo.", "Cierra los desmarques por tu lado."],
  LI: ["Sube por tu banda y vuelve a defender.", "Centra con calidad al llegar al fondo.", "Cierra los desmarques por tu lado."],
  MCD: ["Roba el balón y protege a la defensa.", "Da el primer pase tras recuperar.", "Cubre los huecos del mediocampo."],
  MC: ["Conecta defensa y ataque.", "Muévete para ofrecer línea de pase.", "Administra el ritmo del partido."],
  MCO: ["Recibe entre líneas y filtra el último pase.", "Llega al área como segundo delantero.", "Asocia con los extremos."],
  ED: ["Encara y desborda por tu banda.", "Busca el centro o el disparo.", "Ayuda en la presión alta."],
  EI: ["Encara y desborda por tu banda.", "Busca el centro o el disparo.", "Ayuda en la presión alta."],
  DC: ["Fija a los centrales y ataca el área.", "Define con pocos toques.", "Presiona la salida rival."],
  SD: ["Apoya al delantero y llega al área.", "Recibe de espaldas y asocia.", "Presiona la primera línea."],
};

const GENERIC_GUIDE = [
  "Escucha al entrenador y respeta tu zona.",
  "Mantén tu posición en la cancha.",
  "Comunícate con tus compañeros.",
];

function positionLines(codigo: string | null): string[] {
  if (codigo && POSITION_GUIDE[codigo]) return POSITION_GUIDE[codigo];
  return GENERIC_GUIDE;
}

type MemberRow = {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  position: string | null;
  lineupPosition: string | null;
};

type Alignment = {
  id: string;
  name: string;
  formation: string;
  positions: unknown;
  trazos: unknown;
  createdAt: string;
};

type Payload = {
  membership: { teamId: string; teamName: string } | null;
  members: MemberRow[];
  alignments: Alignment[];
  currentId: string | null;
  meId: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(value)).replace(".", "");
}

export default function AlineacionScreen() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/alineacion", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: Payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">No se pudo cargar la alineación.</div>;
  }
  if (!data) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Cargando alineación…</div>;
  }

  const { membership, members, alignments, currentId, meId } = data;

  if (!membership) {
    return (
      <div className="no-scrollbar h-full overflow-y-auto">
        <div className="player-alineacion-page">
          <header className="player-alineacion-page__header">
            <div>
              <span className="player-alineacion-page__eyebrow">CANCHA · PUBLICACIÓN DEL ENTRENADOR</span>
              <h1>Alineación</h1>
              <p>Consulta tu lugar en el equipo y llega listo para jugar en conjunto.</p>
            </div>
          </header>
          <section className="player-alineacion__empty" aria-label="Sin equipo todavía">
            <span className="player-alineacion-page__eyebrow">SIN EQUIPO TODAVÍA</span>
            <h2>No perteneces a ningún equipo.</h2>
            <p>
              Pide a tu entrenador el código de invitación para unirte desde <strong>Equipos</strong> y ver aquí la
              alineación en vivo.
            </p>
          </section>
        </div>
      </div>
    );
  }

  const selected = alignments.find((a) => a.id === selectedId) ?? alignments[alignments.length - 1] ?? null;
  const isCurrent = selected ? selected.id === currentId : false;

  const players: CanchaPlayer[] = members.map((m) => ({
    id: m.userId,
    name: m.name,
    username: m.username,
    avatarUrl: m.avatarUrl,
    lineupPosition: m.lineupPosition ?? null,
  }));

  const mio = members.find((m) => m.userId === meId);
  const miCodigo = mio?.lineupPosition ?? mio?.position ?? null;
  const publicado = Boolean(selected?.id);
  const mapaPosiciones = (selected?.positions ?? {}) as Record<string, unknown>;
  const esTitular = (m: MemberRow) => mapaPosiciones[m.userId] != null;

  const filaPlantilla = (m: MemberRow): PlayerAlineacionRosterItem => ({
    id: m.userId,
    name: m.name,
    codigo: m.lineupPosition ?? m.position ?? null,
    isCurrent: m.userId === meId,
  });

  const titulares = members.filter(esTitular).map(filaPlantilla);
  const suplentes = members.filter((m) => !esTitular(m)).map(filaPlantilla);

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <div className="player-alineacion-page">
        <header className="player-alineacion-page__header">
          <div>
            <span className="player-alineacion-page__eyebrow">CANCHA · PUBLICACIÓN DEL ENTRENADOR</span>
            <h1>Alineación</h1>
            <p>Consulta tu lugar en la sesión y llega listo para jugar en conjunto.</p>
          </div>
          <div className="player-alineacion-page__status">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>{publicado ? (isCurrent ? "Publicada" : "Anterior") : "Sin publicación"}</strong>
              <small>
                {publicado
                  ? `${selected!.name} · ${selected!.formation}`
                  : "El entrenador aún no publica una alineación."}
              </small>
            </div>
          </div>
        </header>

        {alignments.length > 0 ? (
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                maxWidth: "32rem",
                padding: "0.6rem 0.95rem",
                border: "1px solid rgba(201,162,74,0.3)",
                borderRadius: "14px",
                background: "linear-gradient(120deg, var(--surface-panel), var(--surface-elevated))",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.2rem",
                  height: "2.2rem",
                  flex: "0 0 auto",
                  borderRadius: "12px",
                  background: "rgba(201,162,74,0.18)",
                  fontSize: "1rem",
                }}
              >
                🗓️
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  Alineación publicada
                </span>
                <select
                  value={selected?.id ?? ""}
                  onChange={(event) => setSelectedId(event.target.value)}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    width: "100%",
                    paddingRight: "1.5rem",
                    border: 0,
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {alignments
                    .slice()
                    .reverse()
                    .map((alignment) => (
                      <option key={alignment.id} value={alignment.id}>
                        {alignment.id === currentId ? "Actual · " : ""}
                        {alignment.name} · {alignment.formation} · {formatDate(alignment.createdAt)}
                      </option>
                    ))}
                </select>
              </div>
              <span style={{ position: "absolute", right: "0.95rem", pointerEvents: "none", color: "var(--text-secondary)" }}>
                ▾
              </span>
            </div>
          </div>
        ) : null}

        <section className="player-alineacion__hero" aria-labelledby="player-alineacion-board-title">
          <div className="player-alineacion__hero-copy">
            <span className="player-alineacion-page__eyebrow">{membership.teamName}</span>
            <h2 id="player-alineacion-board-title">{selected?.formation ?? "Sin formación"}</h2>
            <strong>{selected?.name ?? "Alineación del equipo"}</strong>
          </div>
          <PlayerAlineacionCancha>
            <CanchaView
              key={selected?.id ?? "none"}
              teamId={membership.teamId}
              teamName={membership.teamName}
              players={players}
              initialAlignmentId={selected?.id ?? null}
              initialFormation={selected?.formation ?? "4-3-3"}
              initialPositions={(selected?.positions as Record<string, { x: number; y: number }>) ?? null}
              initialTrazos={
                (selected?.trazos as { color: string; width: number; alpha: number; puntos: { x: number; y: number }[] }[]) ?? []
              }
              readOnly
              meId={meId}
              playerWindow
            />
          </PlayerAlineacionCancha>
        </section>

        <div className="player-alineacion__insights">
          <section className="player-alineacion__insight" aria-labelledby="player-alineacion-position-title">
            <span className="player-alineacion-page__eyebrow">TU POSICIÓN</span>
            <h2 id="player-alineacion-position-title">{POSITION_LABELS[miCodigo ?? ""] ?? "Sin posición"}</h2>
            <strong>{miCodigo ?? "—"}</strong>
            <p>{membership.teamName} · lo define el entrenador en su tablero.</p>
          </section>

          <section className="player-alineacion__insight" aria-labelledby="player-alineacion-how-title">
            <span className="player-alineacion-page__eyebrow">CÓMO FUNCIONA</span>
            <h2 id="player-alineacion-how-title">Tu rol</h2>
            <ul className="player-alineacion__insight-list">
              {positionLines(miCodigo).map((linea) => (
                <li key={linea}>
                  <i aria-hidden="true" />
                  {linea}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <PlayerAlineacionRoster starters={titulares} substitutes={suplentes} />
      </div>
    </div>
  );
}
