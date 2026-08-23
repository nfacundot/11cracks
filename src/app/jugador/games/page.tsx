import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Juegos" };

const classicGames = [
  {
    slug: "word",
    emoji: "🔤",
    title: "Palabra a Gol",
    desc: "Escucha, ordena las letras y anota goles. Tienes 3 vidas.",
    color: "#7c3aed",
    bg: "bg-violet-50 dark:bg-violet-950",
  },
  {
    slug: "infograma",
    emoji: "🖼️",
    title: "Infograma",
    desc: "Elige la respuesta correcta entre 4 imágenes. 20 segundos por pregunta.",
    color: "#0891b2",
    bg: "bg-cyan-50 dark:bg-cyan-950",
  },
];

const GAME_MODE_META: Record<string, { label: string; emoji: string }> = {
  ANAGRAM: { label: "Palabra a Gol", emoji: "🔤" },
  INFOGRAMA: { label: "Infograma", emoji: "🖼️" },
};

export default async function GamesPage() {
  const user = await requireUser();

  const adminGames = await prisma.lesson.findMany({
    where: {
      type: "GAME",
      gameMode: { notIn: ["INFOGRAMA", "ANAGRAM"] },
      questions: { some: {} },
    },
    orderBy: { createdAt: "asc" },
    include: {
      questions: { select: { id: true } },
      progress: { where: { userId: user.id } },
      tema: { select: { name: true, emoji: true } },
    },
  });

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
    WORD_GOAL: "word",
    INFOGRAMA: "infograma",
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-black">Juegos interactivos</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Entrena tu mente futbolera y gana XP
        </p>
      </header>

      {adminGames.map((game) => {
        const progress = game.progress[0];
        const mode = game.gameMode ? GAME_MODE_META[game.gameMode] : null;
        return (
          <Link
            key={game.id}
            href={`/jugador/lesson/${game.id}`}
            className="group flex items-center gap-4 rounded-3xl bg-purple-50 p-5 ring-1 ring-black/5 transition hover:shadow-md dark:bg-purple-950 dark:ring-white/10"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm dark:bg-emerald-900">
              {game.emoji}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                {mode ? `${mode.emoji} ${mode.label}` : "Juego del administrador"}
                {game.tema ? ` · ${game.tema.emoji} ${game.tema.name}` : ""}
              </p>
              <h2 className="text-lg font-black">{game.title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {game.questions.length} preguntas · {game.xpReward} XP
              </p>
              {progress?.completed ? (
                <p className="mt-1 text-xs font-black text-purple-500">
                  Completado · {progress.bestScore}/{game.questions.length}
                </p>
              ) : progress ? (
                <p className="mt-1 text-xs font-black text-orange-500">En curso</p>
              ) : (
                <p className="mt-1 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  Sin jugar todavía
                </p>
              )}
            </div>
            <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 dark:text-zinc-600" />
          </Link>
        );
      })}

      {adminGames.length > 0 && <div className="my-1" />}

      <p className="text-center text-[11px] font-black uppercase tracking-widest text-zinc-400">
        Juegos clásicos
      </p>

      {classicGames.map((game) => {
        const best = Object.entries(bestByType).find(
          ([type]) => typeToSlug[type] === game.slug
        );
        const record = best ? best[1] : null;
        return (
          <Link
            key={game.slug}
            href={`/jugador/game/${game.slug}`}
            className={`group flex items-center gap-4 rounded-3xl ${game.bg} p-5 ring-1 ring-black/5 transition hover:shadow-md dark:ring-white/10`}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm dark:bg-emerald-900"
            >
              {game.emoji}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black">{game.title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{game.desc}</p>
              {record ? (
                <p className="mt-1 text-xs font-black" style={{ color: game.color }}>
                  Récord: {record.max} pts · {record.count} jugados
                </p>
              ) : (
                <p className="mt-1 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  Sin jugar todavía
                </p>
              )}
            </div>
            <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 dark:text-zinc-600" />
          </Link>
        );
      })}
    </div>
  );
}
