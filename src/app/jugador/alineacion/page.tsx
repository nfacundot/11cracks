import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { CanchaView, type CanchaPlayer } from "@/components/admin/sections/cancha-view";

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
      <div className="space-y-6 pt-12">
        <GlobalHero
          eyebrow="CANCHA · TIEMPO REAL"
          title="Alineación"
          subtitle="Todavía no perteneces a ningún equipo."
        />
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-8 text-center">
          <p className="text-[14px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Pide a tu entrenador el código de invitación para unirte desde{" "}
            <span className="font-bold text-[#E3C065]">Equipos</span>.
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
  const miEtiqueta = miCodigo
    ? `${miCodigo} · ${POSITION_LABELS[miCodigo] ?? "Posición"}`
    : "Sin posición asignada";

  return (
    <div className="flex flex-col gap-6 pt-12">
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
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Tu posición
          </h3>
          <div className="mt-4 flex items-end justify-between gap-4">
            <span
              style={{
                fontFamily: S.barlow,
                fontWeight: 800,
                fontSize: "clamp(24px, 2.6vw, 32px)",
                lineHeight: 1.1,
                color: S.textPrimary,
              }}
            >
              {miEtiqueta}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-300" style={{ fontFamily: S.barlow }}>
              <span className={`h-2 w-2 rounded-full bg-emerald-400 ${players.length > 0 ? "" : "opacity-40"}`} />
              Sincronizada
            </span>
          </div>
          <p
            className="mt-3 border-t border-white/[0.05] pt-3 text-[12px] font-medium"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            {membership.team.name} · lo define el entrenador en su tablero.
          </p>
        </section>

        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Cómo funciona
          </h3>
          <ul className="mt-4 space-y-2.5">
            {[
              "Tu entrenador mueve a los jugadores en su cancha.",
              "Cada cambio se guarda y llega aquí al instante.",
              "Solo tu equipo puede ver esta pizarra.",
            ].map((linea) => (
              <li key={linea} className="flex items-start gap-2 text-[13px]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A24A]" />
                {linea}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
