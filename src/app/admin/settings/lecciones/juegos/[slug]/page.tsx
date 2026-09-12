import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon } from "@/components/icons";
import { GAME_CATEGORY_META } from "@/lib/games";
import { OidoCrackManager } from "@/components/admin/sections/oido-crack-manager";
import { GolPalabraManager } from "@/components/admin/sections/gol-palabra-manager";
import { LetrasCrackManager } from "@/components/admin/sections/letras-crack-manager";
import { AlimentacionManager } from "@/components/admin/sections/alimentacion-manager";

export const metadata = { title: "Panel de la lección | Admin" };

export const dynamic = "force-dynamic";

function categoryMetaOf(category: string) {
  return GAME_CATEGORY_META[category as "OIDO" | "GOL" | "LETRAS" | "ALIMENTACION"];
}

export default async function GamePanelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSection("ADMIN");
  const { slug } = await params;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: { lesson: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, xpReward: true, tema: { select: { name: true } } } } },
  });
  if (!game) notFound();

  const meta = categoryMetaOf(game.category);

  let wordsComponent: React.ReactNode = null;

  if (game.category === "OIDO") {
    const words = await prisma.oidoCrackWord.findMany({
      where: { gameId: game.id },
      orderBy: [{ active: "desc" }, { order: "asc" }],
      include: { options: { orderBy: { order: "asc" } } },
    });
    wordsComponent = (
      <OidoCrackManager
        gameId={game.id}
        words={words.map((w) => ({
          id: w.id,
          word: w.word,
          label: w.label,
          language: w.language,
          active: w.active,
          options: w.options.map((o) => ({
            id: o.id,
            label: o.label,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        }))}
      />
    );
  } else if (game.category === "GOL") {
    const words = await prisma.golPalabraWord.findMany({
      where: { gameId: game.id },
      orderBy: [{ active: "desc" }, { order: "asc" }],
      include: { options: { orderBy: { order: "asc" } } },
    });
    wordsComponent = (
      <GolPalabraManager
        gameId={game.id}
        words={words.map((w) => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning,
          language: w.language,
          active: w.active,
          options: w.options.map((o) => ({
            id: o.id,
            label: o.label,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        }))}
      />
    );
  } else if (game.category === "LETRAS") {
    const words = await prisma.letrasCrackWord.findMany({
      where: { gameId: game.id },
      orderBy: [{ active: "desc" }, { order: "asc" }],
    });
    wordsComponent = (
      <LetrasCrackManager
        gameId={game.id}
        words={words.map((w) => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning,
          imageUrl: w.imageUrl,
          language: w.language,
          active: w.active,
          letters: w.letters,
        }))}
      />
    );
  } else if (game.category === "ALIMENTACION") {
    const words = await prisma.alimentacionWord.findMany({
      where: { gameId: game.id },
      orderBy: [{ active: "desc" }, { order: "asc" }],
    });
    wordsComponent = (
      <AlimentacionManager
        gameId={game.id}
        words={words.map((w) => ({
          id: w.id,
          name: w.name,
          imageUrl: w.imageUrl,
          audioUrl: w.audioUrl,
          useTts: w.useTts,
          ttsVoice: w.ttsVoice as "female" | "male",
          isHealthy: w.isHealthy,
          language: w.language,
          active: w.active,
          order: w.order,
        }))}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <Link
        href="/admin/settings/lecciones"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Lecciones
      </Link>

      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${game.color}22`, color: game.color }}
        >
          {game.emoji}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-emerald-950 dark:text-white">{game.name}</h2>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
              style={{ backgroundColor: `${game.color}22`, color: game.color }}
            >
              {meta.emoji} {meta.label}
            </span>
            {game.lesson.length > 0 ? (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-green-700 dark:bg-emerald-900 dark:text-green-300">
                XP por lección: {game.lesson[0]?.xpReward} · {game.lesson.length} {game.lesson.length === 1 ? "camino" : "caminos"}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Sin camino configurado
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {game.description ?? "Configura las palabras de este juego."}
          </p>
        </div>
      </div>

      {wordsComponent}
    </div>
  );
}