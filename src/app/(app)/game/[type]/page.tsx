import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GamePenalty } from "@/components/games/game-penalty";
import { GameMemory } from "@/components/games/game-memory";
import { GameSprint } from "@/components/games/game-sprint";
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

const typeSlugs = ["penalty", "memory", "sprint", "word", "infograma"];

export default async function GamePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  await requireUser();
  const { type } = await params;

  if (!typeSlugs.includes(type)) notFound();

  if (type === "memory") {
    const pool = await prisma.question.findMany({
      where: { lesson: { type: "GAME", gameMode: "MEMORY" } },
      select: { id: true, prompt: true, explanation: true },
      take: 30,
    });

    const pairs = shuffle(pool)
      .filter((q) => q.prompt.trim())
      .map((q, i) => ({
        id: `pair-${i}`,
        emoji: q.prompt.trim(),
        text: q.explanation?.trim() || q.prompt.trim(),
      }))
      .slice(0, 8);

    if (pairs.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">🧠</div>
          <h1 className="mt-4 text-xl font-black">Memoria Táctica</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay parejas para este juego. El administrador las creará pronto.
          </p>
        </div>
      );
    }

    return <GameMemory pairs={pairs} />;
  }

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

  const basePool = {
    where: { lesson: { type: "GAME" } },
    include: { options: { orderBy: { order: "asc" } } },
  } as const;

  if (type === "penalty") {
    const pool = await prisma.question.findMany({
      ...basePool,
      where: { lesson: { type: "GAME" }, type: "MULTIPLE_CHOICE" },
      take: 30,
    });

    const questions = shuffle(pool)
      .slice(0, 5)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        correctOptionId: q.options.find((o) => o.isCorrect)?.id ?? "",
        options: shuffle(q.options.map((o) => ({ id: o.id, text: o.text }))),
      }));

    if (questions.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">🥅</div>
          <h1 className="mt-4 text-xl font-black">Tanda de Penales</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay preguntas para este juego. Vuelve más tarde.
          </p>
        </div>
      );
    }

    return <GamePenalty questions={questions} />;
  }

  if (type === "sprint") {
    const pool = await prisma.question.findMany({
      ...basePool,
      where: { lesson: { type: "GAME" }, type: "TRUE_FALSE" },
      take: 30,
    });

    const statements = shuffle(pool)
      .slice(0, 15)
      .map((q) => {
        const correctOption = q.options.find((o) => o.isCorrect);
        return {
          id: q.id,
          prompt: q.prompt,
          isTrue: correctOption?.text === "Verdadero",
        };
      });

    if (statements.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">⚡</div>
          <h1 className="mt-4 text-xl font-black">Sprint Express</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay afirmaciones para este juego. Vuelve más tarde.
          </p>
        </div>
      );
    }

    return <GameSprint statements={statements} />;
  }

  notFound();
}
