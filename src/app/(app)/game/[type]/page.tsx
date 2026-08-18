import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GameWord } from "@/components/games/game-word";
import { GameInfograma } from "@/components/games/game-infograma";

export const metadata = { title: "Juego" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const typeSlugs = ["word", "infograma"];

export default async function GamePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  await requireUser();
  const { type } = await params;

  if (!typeSlugs.includes(type)) notFound();

  if (type === "word") {
    const pool = await prisma.question.findMany({
      where: { lesson: { type: "GAME", gameMode: "ANAGRAM" } },
      select: { prompt: true, explanation: true },
      take: 40,
    });

    const words = shuffle(pool)
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        word: q.prompt.trim().toUpperCase(),
        theme: q.explanation?.trim() || "⚽",
      }))
      .slice(0, 14);

    if (words.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">🔤</div>
          <h1 className="mt-4 text-xl font-black">Palabra a Gol</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay palabras para este juego. El administrador las creará pronto.
          </p>
        </div>
      );
    }

    return <GameWord words={words} />;
  }

  if (type === "infograma") {
    const pool = await prisma.question.findMany({
      where: { lesson: { type: "GAME", gameMode: "INFOGRAMA" } },
      include: { options: { orderBy: { order: "asc" } } },
      take: 40,
    });

    const questions = shuffle(pool)
      .filter(
        (q) =>
          q.options.length === 4 && q.options.every((o) => o.imageUrl && o.text.trim())
      )
      .slice(0, 8)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        explanation: q.explanation,
        correctOptionId: q.options.find((o) => o.isCorrect)?.id ?? "",
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          imageUrl: o.imageUrl as string,
        })),
      }));

    if (questions.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">🖼️</div>
          <h1 className="mt-4 text-xl font-black">Infograma</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay preguntas de Infograma. El administrador las creará pronto.
          </p>
        </div>
      );
    }

    return <GameInfograma questions={questions} />;
  }

  notFound();
}
