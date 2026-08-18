import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PlusIcon, GamepadIcon } from "@/components/icons";
import { DeleteLessonButton } from "@/components/admin/lesson-editor";
import { LessonEditorModal } from "@/components/admin/lesson-editor-modal";

export const metadata = { title: "Juegos | Admin" };

const GAME_MODE_META: Record<string, { label: string; emoji: string; color: string }> = {
  ANAGRAM: { label: "Palabra a Gol", emoji: "🔤", color: "bg-violet-500" },
  INFOGRAMA: { label: "Infograma", emoji: "🖼️", color: "bg-cyan-500" },
};

type GameCardData = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  gameMode: string | null;
  xpReward: number;
  tema: { name: string; emoji: string } | null;
  _count: { questions: number };
};

type EditorClase = {
  id: string;
  name: string;
  emoji: string;
  temas: { id: string; name: string }[];
};

function GameCard({ game, clases }: { game: GameCardData; clases: EditorClase[] }) {
  const meta = game.gameMode ? GAME_MODE_META[game.gameMode] : null;
  const viewHref =
    game.gameMode === "INFOGRAMA"
      ? "/game/infograma"
      : game.gameMode === "ANAGRAM"
        ? "/game/word"
        : `/lesson/${game.id}`;
  return (
    <div className="flex flex-col rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${game.color}22` }}
        >
          {game.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {meta ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${meta.color}`}>
                {meta.emoji} {meta.label}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                Sin tipo
              </span>
            )}
            {game.xpReward > 0 && (
              <span className="text-[10px] font-black text-zinc-400">{game.xpReward} XP</span>
            )}
          </div>
          <h3 className="mt-1 font-black leading-tight text-emerald-950 dark:text-white">
            {game.title}
          </h3>
          {game.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
              {game.description}
            </p>
          )}
          {game.tema && (
            <p className="mt-0.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
              {game.tema.emoji} {game.tema.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
        {game._count.questions} preguntas
      </div>

      <div className="mt-4 flex gap-2 border-t border-green-50 pt-3 dark:border-emerald-900">
        <LessonEditorModal
          clases={clases}
          mode="games"
          lessonId={game.id}
          label="Editar"
          title="Editar juego"
          className="flex-1 rounded-xl bg-green-500 py-2 text-center text-xs font-black text-white transition hover:bg-green-600"
        />
        <Link
          href={viewHref}
          className="rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
        >
          Ver en app
        </Link>
        <DeleteLessonButton id={game.id} />
      </div>
    </div>
  );
}

export default async function AdminJuegosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  await requireAdmin();

  const { tipo } = await searchParams;
  const filterMode =
    tipo && GAME_MODE_META[tipo] ? (tipo as "ANAGRAM" | "INFOGRAMA") : null;

  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: {
      temas: { orderBy: { order: "asc" }, select: { id: true, name: true } },
    },
  });

  const games = await prisma.lesson.findMany({
    where: filterMode ? { type: "GAME", gameMode: filterMode } : { type: "GAME" },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { questions: true } },
      tema: { select: { name: true, emoji: true } },
    },
  });

  const countByMode = await prisma.lesson.groupBy({
    by: ["gameMode"],
    where: { type: "GAME" },
    _count: { _all: true },
  });
  const modeCounts = Object.fromEntries(countByMode.map((c) => [c.gameMode, c._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <GamepadIcon className="h-6 w-6 text-orange-500" />
            Juegos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Crea y edita los juegos de la app: Palabra a Gol e Infograma.
          </p>
        </div>
        <LessonEditorModal
          clases={clases}
          mode="games"
          label={
            <>
              <PlusIcon className="h-4 w-4" />
              Nuevo juego
            </>
          }
          title="Nuevo juego"
          className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-green-200 transition hover:bg-green-600 active:scale-95 dark:shadow-green-950"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/juegos"
          className={`rounded-full px-4 py-2 text-xs font-black transition ${
            !filterMode
              ? "bg-emerald-950 text-white dark:bg-white dark:text-emerald-950"
              : "bg-white/60 backdrop-blur-xl text-zinc-600 hover:bg-green-50 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300"
          }`}
        >
          Todo ({games.length})
        </Link>
        {Object.entries(GAME_MODE_META).map(([key, meta]) => (
          <Link
            key={key}
            href={`/admin/juegos?tipo=${key}`}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              filterMode === key
                ? "bg-emerald-950 text-white dark:bg-white dark:text-emerald-950"
                : "bg-white/60 backdrop-blur-xl text-zinc-600 hover:bg-green-50 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300"
            }`}
          >
            {meta.emoji} {meta.label} ({modeCounts[key] ?? 0})
          </Link>
        ))}
      </div>

      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
          No hay juegos todavía. Crea el primero.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-lg:grid-cols-1">
          {games.map((game) => (
            <GameCard key={game.id} game={game as GameCardData} clases={clases} />
          ))}
        </div>
      )}
    </div>
  );
}
