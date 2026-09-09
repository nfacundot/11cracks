import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  BilingualGameConfig,
  MeaningObjective,
  SpeechLocale,
  TargetLanguage,
} from "@/lib/bilingual/game-contracts";

const golBase = {
  id: "gol-de-palabra" as const,
  label: "Gol de Palabra",
  shortLabel: "Escucha y entiende",
  description: "Elige el significado correcto y manda el balón al arco.",
  mechanicLine: "Escucha. Entiende. Define.",
  support: "Cada significado correcto termina en gol.",
  accent: "lime" as const,
};

const speechLocaleFor = (language: string): SpeechLocale => {
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("es")) return "es-ES";
  return "en-US";
};

const targetLanguageFor = (language: string): TargetLanguage =>
  language.startsWith("pt") ? "pt" : "en";

export async function getGolPalabraGame(gameId?: string): Promise<BilingualGameConfig<MeaningObjective>> {
  const words = await prisma.golPalabraWord.findMany({
    where: { active: true, ...(gameId ? { gameId } : {}) },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  const objectives: MeaningObjective[] = words.map((word) => {
    const correct = word.options.find((option) => option.isCorrect);
    const options: readonly { id: string; label: string }[] = word.options.map((option) => ({
      id: option.id,
      label: option.label,
    }));
    return {
      id: word.id,
      targetLanguage: targetLanguageFor(word.language),
      mechanic: "meaning-choice",
      target: word.word.toUpperCase(),
      audio: {
        kind: "speech",
        text: word.word,
        targetLanguage: targetLanguageFor(word.language),
        language: speechLocaleFor(word.language),
      },
      options,
      correctAnswerId: correct?.id ?? options[0]?.id ?? "",
      feedback: {
        correct: `¡Gol! ${word.word} significa ${word.meaning}.`,
        incorrect: `El remate se fue. ${word.word} significa ${word.meaning}.`,
      },
    };
  });

  const primaryLanguage: TargetLanguage =
    words.length > 0 && words.every((word) => word.language.startsWith("pt"))
      ? "pt"
      : "en";

  return {
    ...golBase,
    session: {
      id: "gol-posiciones-db",
      gameId: "gol-de-palabra",
      environmentId: "entrenamiento",
      environmentLabel: "Entrenamiento",
      title: "Posiciones en cancha",
      targetLanguage: primaryLanguage,
      scene: {
        src: "/scenes/bilinguisimo/gol-de-palabra-frontal-desktop-v1.png",
        mobileSrc: "/scenes/bilinguisimo/gol-de-palabra-frontal-mobile-v1.png",
        alt: "Campo de entrenamiento nocturno visto de frente hacia un arco con maniquíes",
        focalPoint: "50% center",
        crops: { desktop: "50% center", tablet: "50% center", mobile: "50% center" },
        safeInteractionArea: "center-stage",
        protectedVisualArea: "center-goal",
      },
      objectives,
    },
  };
}

export async function hasGolPalabraWords(): Promise<boolean> {
  const count = await prisma.golPalabraWord.count({ where: { active: true } });
  return count > 0;
}