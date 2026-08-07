import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { GamePenalty } from "@/components/games/game-penalty";
import { GameMemory } from "@/components/games/game-memory";
import { GameSprint } from "@/components/games/game-sprint";

export const metadata = { title: "Juego" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const typeSlugs = ["penalty", "memory", "sprint"];

export default async function GamePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  await requireUser();
  const { type } = await params;

  if (!typeSlugs.includes(type)) notFound();

  if (type === "memory") {
    return <GameMemory />;
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
      .slice(0, 10)
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
          <p className="mt-2 text-sm text-zinc-500">
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
        const trueOption = q.options.find((o) => o.isCorrect);
        return {
          id: q.id,
          prompt: q.prompt,
          isTrue: !!trueOption,
        };
      });

    if (statements.length === 0) {
      return (
        <div className="pt-8 text-center">
          <div className="text-6xl">⚡</div>
          <h1 className="mt-4 text-xl font-black">Sprint Express</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Aún no hay afirmaciones para este juego. Vuelve más tarde.
          </p>
        </div>
      );
    }

    return <GameSprint statements={statements} />;
  }

  notFound();
}
