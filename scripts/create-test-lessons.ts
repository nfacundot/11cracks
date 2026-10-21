import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Opt = { text: string; imageUrl?: string; isCorrect: boolean };

/**
 * Crea/actualiza las lecciones de prueba (Preguntados / Contrarreloj / Ambas).
 *
 * Todo es upsert por contenido (prompt / texto de opcion): las preguntas y
 * opciones ya cargadas se conservan en lugar de borrarse y recrearse.
 */
async function upsertLesson(args: {
  key: string;
  title: string;
  emoji: string;
  color: string;
  type: "PREGUNTADOS" | "CONTRARRELOJ";
  optionMode: "TEXT" | "IMAGE" | "BOTH";
  timeSeconds?: number;
  xpReward: number;
  questions: { prompt: string; explanation: string; options: Opt[] }[];
}) {
  const existing = await prisma.lesson.findFirst({
    where: { title: args.title },
    select: { id: true },
  });

  const lesson = existing
    ? await prisma.lesson.update({
        where: { id: existing.id },
        data: {
          type: args.type,
          optionMode: args.optionMode,
          timeSeconds: args.timeSeconds ?? null,
        },
      })
    : await prisma.lesson.create({
        data: {
          title: args.title,
          emoji: args.emoji,
          color: args.color,
          type: args.type,
          optionMode: args.optionMode,
          timeSeconds: args.timeSeconds ?? null,
          xpReward: args.xpReward,
          order: 90,
          questions: { create: [] },
        },
      });

  for (const [qi, q] of args.questions.entries()) {
    const existingQuestion = await prisma.question.findFirst({
      where: { lessonId: lesson.id, prompt: q.prompt },
      select: { id: true },
    });

    const question = existingQuestion
      ? await prisma.question.update({
          where: { id: existingQuestion.id },
          data: {
            type: "MULTIPLE_CHOICE",
            explanation: q.explanation,
            order: qi,
          },
        })
      : await prisma.question.create({
          data: {
            lessonId: lesson.id,
            type: "MULTIPLE_CHOICE",
            prompt: q.prompt,
            explanation: q.explanation,
            order: qi,
          },
        });

    await upsertOptions(question.id, q.options);
  }

  console.log(existing ? `✔ Actualizada: ${args.title}` : `✔ Creada: ${args.title} (${lesson.id})`);
}

async function upsertOptions(questionId: string, options: Opt[]) {
  const existing = await prisma.questionOption.findMany({
    where: { questionId },
    select: { id: true, text: true },
  });
  const idByText = new Map(existing.map((option) => [option.text, option.id]));

  for (const [oi, option] of options.entries()) {
    const id = idByText.get(option.text);
    const data = {
      text: option.text,
      imageUrl: option.imageUrl ?? null,
      isCorrect: option.isCorrect,
      order: oi,
    };
    if (id) {
      await prisma.questionOption.update({ where: { id }, data });
    } else {
      await prisma.questionOption.create({ data: { questionId, ...data } });
    }
  }
}

async function main() {
  await upsertLesson({
    key: "estadio",
    title: "Estadio y fútbol (Preguntados)",
    emoji: "⚽",
    color: "#16a34a",
    type: "PREGUNTADOS",
    optionMode: "TEXT",
    xpReward: 20,
    questions: [
      {
        prompt: "¿Cuánto dura cada tiempo de un partido de fútbol?",
        explanation: "Cada tiempo dura 45 minutos; el árbitro puede añadir tiempo de descuento.",
        options: [
          { text: "45 minutos", isCorrect: true },
          { text: "30 minutos", isCorrect: false },
          { text: "60 minutos", isCorrect: false },
          { text: "90 minutos", isCorrect: false },
        ],
      },
      {
        prompt: "¿Qué jugador ocupa la posición de portero?",
        explanation: "El portero (arquero) es quien defiende la portería.",
        options: [
          { text: "Delantero", isCorrect: false },
          { text: "Portero", isCorrect: true },
          { text: "Defensa", isCorrect: false },
          { text: "Mediocampista", isCorrect: false },
        ],
      },
    ],
  });

  await upsertLesson({
    key: "contrarreloj",
    title: "Récords bajo presión (Contrarreloj)",
    emoji: "⏱️",
    color: "#f59e0b",
    type: "CONTRARRELOJ",
    optionMode: "TEXT",
    timeSeconds: 10,
    xpReward: 25,
    questions: [
      {
        prompt: "¿Qué atleta es conocido como el más rápido del mundo?",
        explanation: "Usain Bolt ostenta récords mundiales en 100 y 200 metros.",
        options: [
          { text: "Usain Bolt", isCorrect: true },
          { text: "Michael Phelps", isCorrect: false },
          { text: "Roger Federer", isCorrect: false },
          { text: "Cristiano Ronaldo", isCorrect: false },
        ],
      },
      {
        prompt: "¿Cuántos anillos olímpicos hay?",
        explanation: "Hay cinco anillos que representan los cinco continentes.",
        options: [
          { text: "4", isCorrect: false },
          { text: "5", isCorrect: true },
          { text: "6", isCorrect: false },
          { text: "7", isCorrect: false },
        ],
      },
    ],
  });

  await upsertLesson({
    key: "basket",
    title: "Basket con apoyo visual (Ambas)",
    emoji: "🏀",
    color: "#f97316",
    type: "PREGUNTADOS",
    optionMode: "BOTH",
    xpReward: 25,
    questions: [
      {
        prompt: "¿Qué deporte se practica en una cancha con aros?",
        explanation: "El baloncesto (basket) se juega encestando el balón en el aro.",
        options: [
          { text: "Vóley", imageUrl: "https://placehold.co/200x150/fbbf24/111?text=Voley", isCorrect: false },
          { text: "Basket", imageUrl: "https://placehold.co/200x150/f97316/fff?text=Basket", isCorrect: true },
          { text: "Tenis", imageUrl: "https://placehold.co/200x150/84cc16/111?text=Tenis", isCorrect: false },
          { text: "Natación", imageUrl: "https://placehold.co/200x150/60a5fa/111?text=Nadar", isCorrect: false },
        ],
      },
    ],
  });

  console.log("Lecciones de prueba listas.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
