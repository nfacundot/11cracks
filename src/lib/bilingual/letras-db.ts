import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  BilingualGameConfig,
  LetterObjective,
  SpeechLocale,
  TargetLanguage,
} from "@/lib/bilingual/game-contracts";

const letrasBase = {
  id: "letras-de-crack" as const,
  label: "Letras de Crack",
  shortLabel: "Escucha y construye",
  description: "Forma correctamente la palabra que escuchas.",
  mechanicLine: "Escucha. Ordena. Construye.",
  support: "Toca una letra para colocarla y tócala otra vez para corregir.",
  accent: "violet" as const,
};

const speechLocaleFor = (language: string): SpeechLocale => {
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("es")) return "es-ES";
  return "en-US";
};

const targetLanguageFor = (language: string): TargetLanguage =>
  language.startsWith("pt") ? "pt" : "en";

export async function getLetrasCrackGame(gameId?: string): Promise<BilingualGameConfig<LetterObjective>> {
  const words = await prisma.letrasCrackWord.findMany({
    where: { active: true, ...(gameId ? { gameId } : {}) },
    orderBy: { order: "asc" },
  });

  const objectives: LetterObjective[] = words.map((word) => {
    const correctOrder = word.word.toUpperCase();
    return {
      id: word.id,
      targetLanguage: targetLanguageFor(word.language),
      mechanic: "letter-build",
      target: correctOrder,
      audio: {
        kind: "speech",
        text: word.word,
        targetLanguage: targetLanguageFor(word.language),
        language: speechLocaleFor(word.language),
      },
      prompt: "Escucha. Mira. Construye.",
      meaning: word.meaning,
      visualAsset: {
        src: word.imageUrl,
        alt: word.meaning,
        width: 627,
        height: 627,
      },
      availableLetters: word.letters,
      correctOrder,
      feedback: {
        correct: `¡Palabra completa! ${word.word} significa ${word.meaning}.`,
        incorrect: `Revisa el orden: ${word.word} se forma ${correctOrder}.`,
      },
    };
  });

  const primaryLanguage: TargetLanguage =
    words.length > 0 && words.every((word) => word.language.startsWith("pt"))
      ? "pt"
      : "en";

  return {
    ...letrasBase,
    session: {
      id: "letras-gastronomia-db",
      gameId: "letras-de-crack",
      environmentId: "gastronomia",
      environmentLabel: "Gastronomía",
      title: "Energía para competir",
      targetLanguage: primaryLanguage,
      scene: {
        src: "/scenes/bilinguisimo/gastronomia-demo-v1.png",
        alt: "Estación de alimentación deportiva en un centro de entrenamiento",
        focalPoint: "50% center",
      },
      objectives,
    },
  };
}

export async function hasLetrasCrackWords(): Promise<boolean> {
  const count = await prisma.letrasCrackWord.count({ where: { active: true } });
  return count > 0;
}