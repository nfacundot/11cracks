import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Juegos" };

const games = [
  {
    slug: "penalty",
    emoji: "🥅",
    title: "Tanda de Penales",
    desc: "8 segundos por disparo. Responde rápido y anota goles.",
    color: "#16a34a",
    bg: "bg-green-50",
  },
  {
    slug: "memory",
    emoji: "🧠",
    title: "Memoria Táctica",
    desc: "Encuentra las parejas de fútbol en el menor tiempo posible.",
    color: "#2563eb",
    bg: "bg-blue-50",
  },
  {
    slug: "sprint",
    emoji: "⚡",
    title: "Sprint Express",
    desc: "Verdadero o falso con solo 5 segundos por afirmación.",
    color: "#d97706",
    bg: "bg-amber-50",
  },
];

export default async function GamesPage() {
  const user = await requireUser();

  const sessions = await prisma.gameSession.groupBy({
    by: ["gameType"],
    where: { userId: user.id },
    _max: { score: true },
    _count: true,
  });

  const bestByType: Record<string, { max: number; count: number }> = {};
  for (const s of sessions) {
    bestByType[s.gameType] = { max: s._max.score ?? 0, count: s._count };
  }

  const typeToSlug: Record<string, string> = {
    PENALTY_SHOOTOUT: "penalty",
    MEMORY_MATCH: "memory",
    QUIZ_SPRINT: "sprint",
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-black">Juegos interactivos</h1>
        <p className="text-sm text-zinc-500">
          Entrena tu mente futbolera y gana XP
        </p>
      </header>

      {games.map((game) => {
        const best = Object.entries(bestByType).find(
          ([type]) => typeToSlug[type] === game.slug
        );
        const record = best ? best[1] : null;
        return (
          <Link
            key={game.slug}
            href={`/game/${game.slug}`}
            className={`group flex items-center gap-4 rounded-3xl ${game.bg} p-5 ring-1 ring-black/5 transition hover:shadow-md`}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm"
            >
              {game.emoji}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black">{game.title}</h2>
              <p className="text-sm text-zinc-500">{game.desc}</p>
              {record ? (
                <p className="mt-1 text-xs font-black" style={{ color: game.color }}>
                  Récord: {record.max} pts · {record.count} jugados
                </p>
              ) : (
                <p className="mt-1 text-xs font-bold text-zinc-400">
                  Sin jugar todavía
                </p>
              )}
            </div>
            <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1" />
          </Link>
        );
      })}
    </div>
  );
}
