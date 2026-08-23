import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlusIcon, GamepadIcon } from "@/components/icons";
import { DeleteLessonButton } from "@/components/admin/lesson-editor";
import { LessonEditorModal } from "@/components/admin/lesson-editor-modal";

const GAME_META: Record<string, { label: string; emoji: string; desc: string; color: string }> = {
  ANAGRAM: {
    label: "Palabra a Gol",
    emoji: "ðŸ”¤",
    desc: "Ordena las letras para formar la palabra antes de que acabe el tiempo.",
    color: "bg-blue-500",
  },
  INFOGRAMA: {
    label: "Infograma",
    emoji: "ðŸ–¼ï¸",
    desc: "Responde preguntas sobre una imagen interactiva.",
    color: "bg-purple-500",
  },
};

type GameCardData = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  gameMode: string | null;
  xpReward: number;
  _count: { questions: number };
};

function GameCard({ game }: { game: GameCardData }) {
  const meta = GAME_META[game.gameMode ?? ""];
  const viewHref =
    game.gameMode === "INFOGRAMA"
      ? `/jugador/game/infograma?lesson=${game.id}`
      : `/jugador/game/word?lesson=${game.id}`;

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
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${meta?.color ?? "bg-zinc-500"}`}>
            {meta?.label ?? game.gameMode}
          </span>
          <h3 className="mt-1 font-black leading-tight text-emerald-950 dark:text-white">{game.title}</h3>
          {game.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{game.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
        <span>{game._count.questions} preguntas</span>
        {game.xpReward > 0 && <span>{game.xpReward} XP</span>}
      </div>

      <div className="mt-4 flex gap-2 border-t border-green-50 pt-3 dark:border-emerald-900">
        <LessonEditorModal
          clases={[]}
          mode="games"
          lessonId={game.id}
          label="Editar"
          title="Editar juego"
          className="flex-1 rounded-xl bg-orange-500 py-2 text-center text-xs font-black text-white transition hover:bg-orange-600"
        />
        <Link
          href={viewHref}
          className="rounded-xl border-2 border-orange-200 px-3 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400"
        >
          Ver en app
        </Link>
        <DeleteLessonButton id={game.id} />
      </div>
    </div>
  );
}

export async function JuegosView({ basePath }: { basePath: string }) {
  const games = await prisma.lesson.findMany({
    where: { type: "GAME" },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <GamepadIcon className="h-6 w-6 text-orange-500" />
            Juegos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mini-juegos independientes del mapa de clases.
          </p>
        </div>
        <LessonEditorModal
          clases={[]}
          mode="games"
          label={
            <>
              <PlusIcon className="h-4 w-4" />
              Nuevo juego
            </>
          }
          title="Nuevo juego"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 active:scale-95 dark:shadow-orange-950"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        {Object.entries(GAME_META).map(([mode, meta]) => (
          <div
            key={mode}
            className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900 dark:bg-orange-950/20"
          >
            <h3 className="flex items-center gap-2 font-black text-emerald-950 dark:text-white">
              <span className="text-xl">{meta.emoji}</span> {meta.label}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{meta.desc}</p>
            <p className="mt-2 text-xs font-black text-orange-600 dark:text-orange-400">
              {games.filter((g) => g.gameMode === mode).length} juego(s) de este tipo
            </p>
          </div>
        ))}
      </div>

      {games.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
          No hay juegos todavía. Crea el primero.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-lg:grid-cols-1">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        ¿Buscas lecciones y quizzes? Están en{" "}
        <Link href={`${basePath}/lessons`} className="font-bold text-green-600 underline dark:text-green-400">
          Lecciones
        </Link>
        .
      </p>
    </div>
  );
}
