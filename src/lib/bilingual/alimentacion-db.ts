import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  BilingualGameConfig,
  ListeningObjective,
  SpeechLocale,
  TargetLanguage,
  VisualOption,
} from "@/lib/bilingual/game-contracts";

const alimentacionBase = {
  id: "alimentacion" as const,
  label: "Alimentación",
  shortLabel: "Clasifica alimentos",
  description: "Arrastra alimentos a saludable o no saludable y escucha su pronunciación.",
  mechanicLine: "Escucha. Clasifica. Comprueba.",
  support: "Puedes escuchar la pronunciación otra vez.",
  accent: "lime" as const,
};

const speechLocales: Record<string, SpeechLocale> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  pt: "pt-BR",
  it: "it-IT",
  de: "de-DE",
  ar: "ar-SA",
  hi: "hi-IN",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  nl: "nl-NL",
  ru: "ru-RU",
  pl: "pl-PL",
  tr: "tr-TR",
  sv: "sv-SE",
  da: "da-DK",
  fi: "fi-FI",
};

const speechLocaleFor = (language: string): SpeechLocale =>
  speechLocales[language] ?? "es-ES";

const targetLanguageFor = (language: string): TargetLanguage =>
  language.startsWith("pt") ? "pt" : language.startsWith("es") ? "en" : "en";

export async function getAlimentacionGame(gameId?: string): Promise<BilingualGameConfig<ListeningObjective>> {
  const words = await prisma.alimentacionWord.findMany({
    where: { active: true, ...(gameId ? { gameId } : {}) },
    orderBy: { order: "asc" },
  });

  const objectives: ListeningObjective[] = words.map((word) => {
    const options: readonly VisualOption[] = [
      {
        id: `${word.id}-healthy`,
        label: "Saludable",
        asset: {
          src: word.imageUrl,
          alt: word.name,
          width: 400,
          height: 400,
        },
      },
      {
        id: `${word.id}-unhealthy`,
        label: "No saludable",
        asset: {
          src: word.imageUrl,
          alt: word.name,
          width: 400,
          height: 400,
        },
      },
    ];
    return {
      id: word.id,
      targetLanguage: targetLanguageFor(word.language),
      mechanic: "visual-choice",
      target: word.name.toUpperCase(),
      audio: {
        kind: "speech",
        text: word.name,
        targetLanguage: targetLanguageFor(word.language),
        language: speechLocaleFor(word.language),
        audioSrc: word.audioUrl ?? undefined,
      },
      options,
      correctAnswerId: word.isHealthy ? options[0].id : options[1].id,
      feedback: {
        correct: `¡Correcto! ${word.name} es ${word.isHealthy ? "saludable" : "no saludable"}.`,
        incorrect: `Intenta de nuevo. ${word.name} es ${word.isHealthy ? "saludable" : "no saludable"}.`,
      },
    };
  });

  const primaryLanguage: TargetLanguage =
    words.length > 0 && words.every((word) => word.language.startsWith("pt"))
      ? "pt"
      : "en";

  return {
    ...alimentacionBase,
    session: {
      id: "alimentacion-db",
      gameId: "alimentacion",
      environmentId: "cocina",
      environmentLabel: "Cocina",
      title: "Alimentos saludables",
      targetLanguage: primaryLanguage,
      scene: {
        src: "/scenes/bilinguisimo/cocina-demo-v1.png",
        alt: "Cocina con alimentos variados",
        focalPoint: "center",
        crops: { desktop: "center", tablet: "center", mobile: "center" },
        safeInteractionArea: "center-stage",
        protectedVisualArea: "food-station",
      },
      objectives,
    },
  };
}

export type AlimentacionWord = {
  id: string;
  name: string;
  imageUrl: string;
  audioUrl: string | null;
  isHealthy: boolean;
  language: string;
  active: boolean;
  order: number;
};

export async function getAlimentacionWords(gameId?: string): Promise<{
  words: AlimentacionWord[];
  healthy: AlimentacionWord[];
  unhealthy: AlimentacionWord[];
}> {
  const where = {
    active: true,
    ...(gameId ? { gameId } : {}),
  };

  const words = await prisma.alimentacionWord.findMany({
    where,
    orderBy: [{ active: "desc" }, { order: "asc" }],
  });

  return {
    words,
    healthy: words.filter((w) => w.isHealthy),
    unhealthy: words.filter((w) => !w.isHealthy),
  };
}