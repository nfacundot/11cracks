import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  BilingualGameConfig,
  ListeningObjective,
  SpeechLocale,
  TargetLanguage,
  VisualOption,
} from "@/lib/bilingual/game-contracts";

const oidoBase = {
  id: "oido-de-crack" as const,
  label: "Oído de Crack",
  shortLabel: "Escucha y reconoce",
  description: "Reconoce lo que escuchas dentro y fuera de la cancha.",
  mechanicLine: "Escucha. Mira. Elige.",
  support: "Puedes escuchar el audio otra vez.",
  accent: "cyan" as const,
};

const speechLocaleFor = (language: string): SpeechLocale => {
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("es")) return "es-ES";
  return "en-US";
};

const targetLanguageFor = (language: string): TargetLanguage =>
  language.startsWith("pt") ? "pt" : language.startsWith("es") ? "en" : "en";

export async function getOidoCrackGame(gameId?: string): Promise<BilingualGameConfig<ListeningObjective>> {
  const words = await prisma.oidoCrackWord.findMany({
    where: { active: true, ...(gameId ? { gameId } : {}) },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  const objectives: ListeningObjective[] = words.map((word) => {
    const correct = word.options.find((option) => option.isCorrect);
    const options: readonly VisualOption[] = word.options.map((option) => ({
      id: option.id,
      label: option.label,
      asset: {
        src: option.imageUrl,
        alt: option.label,
        width: 1254,
        height: 1254,
      },
    }));
    return {
      id: word.id,
      targetLanguage: targetLanguageFor(word.language),
      mechanic: "visual-choice",
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
        correct: word.label
          ? `¡Bien! ${word.word} es ${word.label}.`
          : `¡Bien! ${word.word}.`,
        incorrect: word.label
          ? `Escucha otra vez: ${word.word} es ${word.label}.`
          : `Escucha otra vez: ${word.word}.`,
      },
    };
  });

  const primaryLanguage: TargetLanguage =
    words.length > 0 && words.every((word) => word.language.startsWith("pt"))
      ? "pt"
      : "en";

  return {
    ...oidoBase,
    session: {
      id: "oido-vestuario-db",
      gameId: "oido-de-crack",
      environmentId: "vestuario",
      environmentLabel: "Vestuario",
      title: "La equipación",
      targetLanguage: primaryLanguage,
      scene: {
        src: "/scenes/bilinguisimo/vestuario-demo-v1.png",
        alt: "Vestuario de fútbol preparado antes del partido",
        focalPoint: "62% center",
        crops: { desktop: "62% center", tablet: "66% center", mobile: "73% center" },
        safeInteractionArea: "center-stage",
        protectedVisualArea: "right-tunnel",
      },
      objectives,
    },
  };
}

export async function hasOidoCrackWords(): Promise<boolean> {
  const count = await prisma.oidoCrackWord.count({ where: { active: true } });
  return count > 0;
}