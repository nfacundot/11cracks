import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBilingualGame } from "@/lib/bilingual/demo-content";
import { getOidoCrackGame } from "@/lib/bilingual/oido-db";
import { getGolPalabraGame } from "@/lib/bilingual/gol-db";
import { getLetrasCrackGame } from "@/lib/bilingual/letras-db";
import { getAlimentacionGame } from "@/lib/bilingual/alimentacion-db";
import { GameExperience } from "@/components/player/bilinguisimo/game-experience";

export default async function Page({ params, searchParams }: { params: Promise<{ gameId: string }>; searchParams: Promise<{ lesson?: string; nextLesson?: string }> }) {
  const [{ gameId }, { lesson: queryLessonId, nextLesson: queryNextLesson }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const nextHref = queryNextLesson ? `/jugador/neurocracks/leccion/${queryNextLesson}` : null;

  const registered = await prisma.game.findFirst({
    where: { OR: [{ id: gameId }, { slug: gameId }] },
    select: { id: true, category: true, active: true },
  });

  if (registered?.active) {
    const registeredGameId = registered.id;
    if (registered.category === "OIDO") {
      const game = await getOidoCrackGame(registered.id);
      if (game.session.objectives.length === 0) notFound();
      return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} registeredGameId={registeredGameId} nextHref={nextHref} />;
    }

    if (registered.category === "GOL") {
      const game = await getGolPalabraGame(registered.id);
      if (game.session.objectives.length === 0) notFound();
      return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} registeredGameId={registeredGameId} nextHref={nextHref} />;
    }

    if (registered.category === "LETRAS") {
      const game = await getLetrasCrackGame(registered.id);
      if (game.session.objectives.length === 0) notFound();
      return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} registeredGameId={registeredGameId} nextHref={nextHref} />;
    }

    if (registered.category === "ALIMENTACION") {
      const game = await getAlimentacionGame(registered.id);
      if (game.session.objectives.length === 0) notFound();
      return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} registeredGameId={registeredGameId} nextHref={nextHref} />;
    }
  }

  // Juegos no registrados en la tabla Game caen al contenido demo
  if (gameId === "oido-de-crack" || gameId === "gol-de-palabra" || gameId === "letras-de-crack") {
    const game =
      gameId === "oido-de-crack"
        ? await getOidoCrackGame()
        : gameId === "gol-de-palabra"
          ? await getGolPalabraGame()
          : await getLetrasCrackGame();
    if (game.session.objectives.length === 0) notFound();
    return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} nextHref={nextHref} />;
  }

  const game = getBilingualGame(gameId);
  if (!game) notFound();
  return <GameExperience playerId={user.id} game={game} lessonId={queryLessonId ?? null} nextHref={nextHref} />;
}