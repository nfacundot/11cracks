import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CanchaView, type CanchaPlayer } from "@/components/admin/sections/cancha-view";
import { PlayerAlineacionRoster, type PlayerAlineacionRosterItem } from "@/components/player/player-alineacion-roster";
import { PlayerAlineacionCancha } from "@/components/player/player-alineacion-cancha";

export const metadata = { title: "Alineación" };

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

export default async function Page() {
  const user = await requireSection("JUGADOR");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          alignments: {
            where: { published: true },
            orderBy: { order: "asc" },
            take: 1,
            select: {
              id: true,
              name: true,
              formation: true,
              positions: true,
              trazos: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return (
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
            Pide a tu entrenador el código de invitación para unirte desde{" "}
            <strong>Equipos</strong> y ver aquí la alineación en vivo.
          </p>
        </section>
      </div>
    );
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId: membership.teamId, role: "PLAYER" },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      lineupPosition: true,
      user: { select: { id: true, name: true, username: true, avatarUrl: true, position: true } },
    },
  });

  const players: CanchaPlayer[] = members.map((m) => ({
    id: m.userId,
    name: m.user.name,
    username: m.user.username,
    avatarUrl: m.user.avatarUrl,
    lineupPosition: m.lineupPosition ?? null,
  }));

  const current = membership.team.alignments[0] ?? null;

  const mio = members.find((m) => m.userId === user.id);
  const miCodigo = mio?.lineupPosition ?? mio?.user.position ?? null;

  const publicado = Boolean(current?.id);

  const mapaPosiciones = (current?.positions ?? {}) as Record<string, unknown>;
  const esTitular = (m: (typeof members)[number]) => mapaPosiciones[m.userId] != null;

  const filaPlantilla = (m: (typeof members)[number]): PlayerAlineacionRosterItem => ({
    id: m.userId,
    name: m.user.name,
    codigo: m.lineupPosition ?? m.user.position ?? null,
    isCurrent: m.userId === user.id,
  });

  const titulares = members.filter(esTitular).map(filaPlantilla);
  const suplentes = members.filter((m) => !esTitular(m)).map(filaPlantilla);

  return (
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
            <strong>{publicado ? "Publicada" : "Sin publicación"}</strong>
            <small>{publicado ? `${current!.name} · ${current!.formation}` : "El entrenador aún no publica una alineación."}</small>
          </div>
        </div>
      </header>

      <section className="player-alineacion__hero" aria-labelledby="player-alineacion-board-title">
        <div className="player-alineacion__hero-copy">
          <span className="player-alineacion-page__eyebrow">{membership.team.name}</span>
          <h2 id="player-alineacion-board-title">{current?.formation ?? "Sin formación"}</h2>
          <strong>{current?.name ?? "Alineación del equipo"}</strong>
          <p>Los movimientos del entrenador llegan aquí al instante cuando se publican.</p>
        </div>
        <PlayerAlineacionCancha>
          <CanchaView
            teamId={membership.team.id}
            teamName={membership.team.name}
            players={players}
            initialAlignmentId={current?.id ?? null}
            initialFormation={current?.formation ?? "4-3-3"}
            initialPositions={(current?.positions as Record<string, { x: number; y: number }>) ?? null}
            initialTrazos={(current?.trazos as { color: string; width: number; alpha: number; puntos: { x: number; y: number }[] }[]) ?? []}
            readOnly
            meId={user.id}
            playerWindow
          />
        </PlayerAlineacionCancha>
      </section>

      <div className="player-alineacion__insights">
        <section className="player-alineacion__insight" aria-labelledby="player-alineacion-position-title">
          <span className="player-alineacion-page__eyebrow">TU POSICIÓN</span>
          <h2 id="player-alineacion-position-title">{POSITION_LABELS[miCodigo ?? ""] ?? "Sin posición"}</h2>
          <strong>{miCodigo ?? "—"}</strong>
          <p>{membership.team.name} · lo define el entrenador en su tablero.</p>
        </section>

        <section className="player-alineacion__insight" aria-labelledby="player-alineacion-how-title">
          <span className="player-alineacion-page__eyebrow">CÓMO FUNCIONA</span>
          <h2 id="player-alineacion-how-title">Esta alineación</h2>
          <ul className="player-alineacion__insight-list">
            {[
              "Tu entrenador mueve a los jugadores en su cancha.",
              "Cada cambio se guarda y llega aquí al instante.",
              "Solo tu equipo puede ver esta pizarra.",
            ].map((linea) => (
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
  );
}