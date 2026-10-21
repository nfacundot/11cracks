import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type QuestionSeed = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  explanation?: string;
  options: { text: string; isCorrect?: boolean }[];
};

type LessonSeed = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  type: "LESSON" | "QUIZ" | "GAME";
  gameMode?: "ANAGRAM" | null;
  xpReward: number;
  posX?: number;
  posY?: number;
  questions: QuestionSeed[];
};

const ETAPAS: {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  order: number;
}[] = [
  {
    id: "subject-futbol",
    name: "Fundamentos del Fútbol",
    description: "Reglas, posiciones y técnica básica del deporte rey.",
    emoji: "⚽",
    color: "#16a34a",
    order: 0,
  },
  {
    id: "subject-cultura",
    name: "Cultura Futbolera",
    description: "Historia, torneos y curiosidades del mundo del fútbol.",
    emoji: "🏆",
    color: "#9333ea",
    order: 1,
  },
  {
    id: "cmswgp0i5000e24kuumhko0u0",
    name: "Etapa 3",
    description: "Día de partido: convivencia, táctica y afición en el estadio.",
    emoji: "🎯",
    color: "#dc2626",
    order: 2,
  },
];

const MATERIAS_TEMPLATE_ETAPA3: {
  slug: string;
  title: string;
  emoji: string;
  color: string;
  posX: number;
  posY: number;
  vocab: [string, string][];
}[] = [
  {
    slug: "casa",
    title: "CASA",
    emoji: "🏠",
    color: "#b39af5",
    posX: 50,
    posY: 16,
    vocab: [["mascota", "mascot"], ["foto", "photo"], ["uniforme", "uniform"], ["familia", "family"], ["desayuno", "breakfast"]],
  },
  {
    slug: "entrenamiento",
    title: "ENTRENAMIENTO",
    emoji: "💪",
    color: "#16a34a",
    posX: 22,
    posY: 40,
    vocab: [["táctica", "tactics"], ["remate", "shot"], ["defensa", "defense"], ["resistencia", "stamina"], ["silbato", "whistle"]],
  },
  {
    slug: "gastronomia",
    title: "GASTRONOMÍA",
    emoji: "🍽️",
    color: "#d97706",
    posX: 78,
    posY: 40,
    vocab: [["hidratación", "hydration"], ["ensalada", "salad"], ["pasta", "pasta"], ["jugo", "juice"], ["plátano", "banana"]],
  },
  {
    slug: "hotel",
    title: "HOTEL",
    emoji: "🏨",
    color: "#2563eb",
    posX: 22,
    posY: 66,
    vocab: [["recepción", "reception"], ["maleta", "suitcase"], ["alarma", "alarm"], ["descanso", "rest"], ["toalla", "towel"]],
  },
  {
    slug: "estadio",
    title: "ESTADIO",
    emoji: "🏟️",
    color: "#9333ea",
    posX: 78,
    posY: 66,
    vocab: [["bandera", "flag"], ["cántico", "chant"], ["árbitro", "referee"], ["marcador", "scoreboard"], ["golazo", "great goal"]],
  },
];

/**
 * Posicion estable (determinista) dentro de un conjunto de n elementos.
 *
 * Antes se usaba Math.random(), lo que hacia que cada ejecucion del seed
 * generase un conjunto de opciones distinto y obligase a recrearlas.
 */
function stableIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function optionsFor(correct: string, distractors: string[]): QuestionSeed["options"] {
  const pool = [...distractors.filter((item) => item !== correct)];
  const correctIndex = stableIndex(correct, 4);
  const options: QuestionSeed["options"] = [{ text: correct, isCorrect: true }];
  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) options[i] = { text: correct, isCorrect: true };
    else {
      const word = pool[i % pool.length];
      options[i] = { text: word, isCorrect: false };
    }
  }
  return options;
}

function juegosUnicos(): LessonSeed[] {
  const vocabulary = MATERIAS_TEMPLATE_ETAPA3.flatMap((materia) => materia.vocab);
  const esWords = vocabulary.map(([es]) => es);
  const enWords = vocabulary.map(([, en]) => en);

  return [
    {
      id: "bib-oido-de-crack",
      title: "Oído de Crack",
      description: "Escucha la palabra y elige la respuesta correcta.",
      emoji: "🎧",
      color: "#0ea5e9",
      type: "LESSON",
      xpReward: 20,
      questions: vocabulary.map(([es, en]) => ({
        type: "MULTIPLE_CHOICE",
        prompt: `Escuchaste "${en}". ¿Cuál es la palabra correcta?`,
        explanation: `${en} significa ${es}.`,
        options: optionsFor(es, esWords),
      })),
    },
    {
      id: "bib-gol-de-palabra",
      title: "Gol de Palabra",
      description: "Une la palabra en español con su traducción en inglés.",
      emoji: "⚽",
      color: "#16a34a",
      type: "LESSON",
      xpReward: 20,
      questions: vocabulary.map(([es, en]) => ({
        type: "MULTIPLE_CHOICE",
        prompt: `¿Cómo se dice "${es}" en inglés?`,
        explanation: `${es} se traduce como ${en}.`,
        options: optionsFor(en, enWords),
      })),
    },
    {
      id: "bib-letras-de-crack",
      title: "Letras de Crack",
      description: "Ordena las letras para formar la palabra en inglés.",
      emoji: "🔤",
      color: "#9333ea",
      type: "GAME",
      gameMode: "ANAGRAM",
      xpReward: 20,
      questions: vocabulary.map(([es, en]) => ({
        type: "MULTIPLE_CHOICE",
        prompt: en,
        explanation: es,
        options: [],
      })),
    },
  ];
}

/**
 * Sincroniza las preguntas de una leccion sin borrar las existentes.
 *
 * La identidad estable es el "prompt": si la pregunta ya existe se actualiza
 * conservando su id (y por lo tanto sus AnswerRecord y LessonProgress
 * asociados); si no existe, se crea. Las preguntas que ya no esten en la
 * plantilla se conservan: este seed nunca borra historial de aprendizaje.
 */
async function syncQuestions(lessonId: string, questions: QuestionSeed[]) {
  const existing = await prisma.question.findMany({
    where: { lessonId },
    select: { id: true, prompt: true },
  });
  const idByPrompt = new Map(existing.map((question) => [question.prompt, question.id]));

  for (const [qi, q] of questions.entries()) {
    const questionId = idByPrompt.get(q.prompt);
    const question = questionId
      ? await prisma.question.update({
          where: { id: questionId },
          data: { type: q.type, explanation: q.explanation, order: qi },
        })
      : await prisma.question.create({
          data: {
            lessonId,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            order: qi,
          },
        });
    await syncOptions(question.id, q.options);
  }
}

/** Igual que syncQuestions, pero para las opciones: la identidad es el texto. */
async function syncOptions(questionId: string, options: QuestionSeed["options"]) {
  const existing = await prisma.questionOption.findMany({
    where: { questionId },
    select: { id: true, text: true },
  });
  const idByText = new Map(existing.map((option) => [option.text, option.id]));

  for (const [oi, option] of options.entries()) {
    const data = { text: option.text, isCorrect: option.isCorrect ?? false, order: oi };
    const optionId = idByText.get(option.text);
    if (optionId) {
      await prisma.questionOption.update({ where: { id: optionId }, data });
    } else {
      await prisma.questionOption.create({ data: { questionId, ...data } });
    }
  }

  // Se retiran las opciones que ya no forman parte de la plantilla para que el
  // seed sea idempotente. Solo se hace cuando la plantilla define opciones:
  // una lista vacia significa "el seed no gestiona este contenido".
  const labels = options.map((option) => option.text);
  if (labels.length > 0) {
    await prisma.questionOption.deleteMany({ where: { questionId, text: { notIn: labels } } });
  }
}

/** Opciones de "Oído de Crack": la identidad estable es la etiqueta. */
async function syncOidoOptions(
  wordId: string,
  options: { label: string; imageUrl: string; isCorrect: boolean }[],
) {
  const existing = await prisma.oidoCrackOption.findMany({
    where: { wordId },
    select: { id: true, label: true },
  });
  const idByLabel = new Map(existing.map((option) => [option.label, option.id]));

  for (const [oi, option] of options.entries()) {
    const data = { label: option.label, imageUrl: option.imageUrl, isCorrect: option.isCorrect, order: oi };
    const optionId = idByLabel.get(option.label);
    if (optionId) {
      await prisma.oidoCrackOption.update({ where: { id: optionId }, data });
    } else {
      await prisma.oidoCrackOption.create({ data: { wordId, ...data } });
    }
  }

  const labels = options.map((option) => option.label);
  if (labels.length > 0) {
    await prisma.oidoCrackOption.deleteMany({ where: { wordId, label: { notIn: labels } } });
  }
}

/** Opciones de "Gol de Palabra": la identidad estable es la etiqueta. */
async function syncGolOptions(wordId: string, options: { label: string; isCorrect: boolean }[]) {
  const existing = await prisma.golPalabraOption.findMany({
    where: { wordId },
    select: { id: true, label: true },
  });
  const idByLabel = new Map(existing.map((option) => [option.label, option.id]));

  for (const [oi, option] of options.entries()) {
    const data = { label: option.label, isCorrect: option.isCorrect, order: oi };
    const optionId = idByLabel.get(option.label);
    if (optionId) {
      await prisma.golPalabraOption.update({ where: { id: optionId }, data });
    } else {
      await prisma.golPalabraOption.create({ data: { wordId, ...data } });
    }
  }

  const labels = options.map((option) => option.label);
  if (labels.length > 0) {
    await prisma.golPalabraOption.deleteMany({ where: { wordId, label: { notIn: labels } } });
  }
}

async function main() {
  const oldStageLessons = await prisma.lesson.findMany({ where: { temaId: { startsWith: "stage-" } }, select: { id: true } });
  if (oldStageLessons.length > 0) {
    await prisma.lesson.deleteMany({ where: { id: { in: oldStageLessons.map((lesson) => lesson.id) } } });
  }
  await prisma.tema.deleteMany({ where: { id: { startsWith: "stage-" } } });

  // Las materias "demo-materia-*" NO se borran: se hacen upsert más abajo.
  // Borrarlas y recrearlas perdia la posicion ya ajustada en el mapa (posX/posY)
  // y los vinculos etapa/materia registrados en la app.
  await prisma.lesson.deleteMany({
    where: {
      title: {
        in: ["Reglas básicas del fútbol", "Las posiciones", "El fuera de juego", "Faltas y tarjetas", "Los grandes torneos", "Estrategia y táctica", "Quiz relámpago", "Crack test", "Técnica: el pase", "Técnica: control y recepción", "Entrenamiento: defensa 1 vs 1", "Quiz: goleadores históricos", "Palabras en juego", "Memoria Táctica", "Palabra a Gol"],
      },
      temaId: null,
    },
  });

  for (const etapa of ETAPAS) {
    await prisma.clase.upsert({
      where: { id: etapa.id },
      update: {
        name: etapa.name,
        description: etapa.description,
        emoji: etapa.emoji,
        color: etapa.color,
        order: etapa.order,
      },
      create: {
        id: etapa.id,
        name: etapa.name,
        description: etapa.description,
        emoji: etapa.emoji,
        color: etapa.color,
        order: etapa.order,
      },
    });
    console.log(`✔ Etapa: ${etapa.emoji} ${etapa.name}`);
  }

  const materias = MATERIAS_TEMPLATE_ETAPA3;

  for (const [index, materia] of materias.entries()) {
    const materiaId = `demo-materia-cmswgp0i5000e24kuumhko0u0-${materia.slug}`;
    await prisma.tema.upsert({
      where: { id: materiaId },
      update: {
        name: materia.title,
        emoji: materia.emoji,
        color: materia.color,
        order: index + 1,
        xpReward: 60,
        // posX/posY se omiten a proposito: en un upsert no se tocan, de modo que
        // se respeta la posicion real de cada materia en el mapa.
      },
      create: {
        id: materiaId,
        name: materia.title,
        emoji: materia.emoji,
        color: materia.color,
        order: index + 1,
        xpReward: 60,
        posX: materia.posX,
        posY: materia.posY,
      },
    });
    const etapaIndex = Math.min(2, Math.floor(index / 2));
    const etapaId = ETAPAS[etapaIndex].id;
    // connect es aditivo: no desvincula la materia de otras etapas ya cargadas.
    await prisma.tema.update({
      where: { id: materiaId },
      data: { clases: { connect: [{ id: etapaId }] } },
    });

    await prisma.etapaTema.upsert({
      where: { claseId_temaId: { claseId: etapaId, temaId: materiaId } },
      update: {},
      create: { claseId: etapaId, temaId: materiaId, posX: materia.posX, posY: materia.posY },
    });
    console.log(`  ✔ Materia: ${materia.emoji} ${materia.title} → ${ETAPAS[etapaIndex].name} (${materia.posX}%, ${materia.posY}%)`);
  }

  for (const leccion of juegosUnicos()) {
    const existing = await prisma.lesson.findUnique({ where: { id: leccion.id }, select: { temaId: true } });
    const preserveTemaId = existing?.temaId ?? null;
    await prisma.lesson.upsert({
      where: { id: leccion.id },
      update: {
        title: leccion.title,
        description: leccion.description,
        emoji: leccion.emoji,
        color: leccion.color,
        type: leccion.type,
        gameMode: leccion.gameMode ?? null,
        xpReward: leccion.xpReward,
        order: 100,
        temaId: preserveTemaId,
      },
      create: {
        id: leccion.id,
        title: leccion.title,
        description: leccion.description,
        emoji: leccion.emoji,
        color: leccion.color,
        type: leccion.type,
        gameMode: leccion.gameMode ?? null,
        xpReward: leccion.xpReward,
        order: 100,
        temaId: null,
      },
    });
    // Las preguntas se sincronizan aparte por "prompt": borrarlas y recrearlas
    // arrastraba en cascada los AnswerRecord historicos de cada pregunta.
    await syncQuestions(leccion.id, leccion.questions);
    console.log(`  ✔ Lección suelta: ${leccion.title} (${leccion.questions.length} preguntas)${preserveTemaId ? ` ·保留 temaId` : ""}`);
  }

  // Asignar lecciones sueltas a materias existentes si no tienen temaId
  const existingMaterias = await prisma.tema.findMany({
    where: { id: { startsWith: "demo-materia-" } },
    orderBy: { order: "asc" },
    select: { id: true, name: true, clases: { select: { id: true } } },
  });
  if (existingMaterias.length > 0) {
    const leccionesSueltas = await prisma.lesson.findMany({
      where: { id: { in: ["bib-oido-de-crack", "bib-gol-de-palabra", "bib-letras-de-crack"] }, temaId: null },
      select: { id: true },
    });
    if (leccionesSueltas.length > 0) {
      for (let i = 0; i < leccionesSueltas.length; i++) {
        const lessonId = leccionesSueltas[i].id;
        // La leccion ya esta ubicada en el mapa via EtapaLesson: se respeta esa
        // etapa y se elige una materia de la misma etapa. Solo si no hay vinculo
        // se recurre al orden de materias.
        const etapaLesson = await prisma.etapaLesson.findFirst({
          where: { lessonId },
          select: { claseId: true },
        });
        const materiaEnEtapa = etapaLesson
          ? existingMaterias.find((materia) => materia.clases.some((clase) => clase.id === etapaLesson.claseId))
          : undefined;
        const materia = materiaEnEtapa ?? existingMaterias[i % existingMaterias.length];
        await prisma.lesson.update({
          where: { id: lessonId },
          data: { temaId: materia.id },
        });
        console.log(`  ✔ Lección ${lessonId} asignada a materia ${materia.name}`);
      }
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: "superadmin@gmail.com" },
    update: {
      username: "admin11",
      name: "Admin",
      role: "SUPERADMIN",
      password: await bcrypt.hash("123456", 10),
    },
    create: {
      email: "superadmin@gmail.com",
      username: "admin11",
      name: "Admin",
      password: await bcrypt.hash("123456", 10),
      role: "SUPERADMIN",
      xp: 120,
    },
  });
  console.log(`✔ Usuario 1 (superadmin): ${admin.email} (${admin.role})`);

  const adminSecundario = await prisma.user.upsert({
    where: { email: "admin@11cracks.com" },
    update: {
      username: "admin",
      name: "Administrador",
      role: "ADMIN",
      password: await bcrypt.hash("123456", 10),
    },
    create: {
      email: "admin@11cracks.com",
      username: "admin",
      name: "Administrador",
      password: await bcrypt.hash("123456", 10),
      role: "ADMIN",
      xp: 90,
    },
  });
  console.log(`✔ Usuario 2 (admin): ${adminSecundario.email} (${adminSecundario.role})`);

  const entrenador = await prisma.user.upsert({
    where: { email: "entrenador@11cracks.com" },
    update: {
      username: "entrenador11",
      name: "Entrenador",
      role: "ENTRENADOR",
      password: await bcrypt.hash("123456", 10),
    },
    create: {
      email: "entrenador@11cracks.com",
      username: "entrenador11",
      name: "Entrenador",
      password: await bcrypt.hash("123456", 10),
      role: "ENTRENADOR",
      xp: 60,
    },
  });
  console.log(`✔ Usuario 3 (entrenador): ${entrenador.email} (${entrenador.role})`);

  const jugador = await prisma.user.upsert({
    where: { email: "jugador@11cracks.com" },
    update: {
      username: "jugador11",
      name: "Jugador",
      role: "JUGADOR",
      password: await bcrypt.hash("123456", 10),
    },
    create: {
      email: "jugador@11cracks.com",
      username: "jugador11",
      name: "Jugador",
      password: await bcrypt.hash("123456", 10),
      role: "JUGADOR",
      xp: 30,
    },
  });
  console.log(`✔ Usuario 4 (jugador): ${jugador.email} (${jugador.role})`);

  const games = [
    {
      id: "game-oido-de-crack",
      slug: "oido-de-crack",
      name: "Oído de Crack",
      category: "OIDO" as const,
      emoji: "👂",
      color: "#22c55e",
      description: "Escucha y elige la imagen correcta",
      order: 0,
    },
    {
      id: "game-gol-de-palabra",
      slug: "gol-de-palabra",
      name: "Gol de Palabra",
      category: "GOL" as const,
      emoji: "⚽",
      color: "#3b82f6",
      description: "Vincula la palabra con su significado",
      order: 1,
    },
    {
      id: "game-letras-de-crack",
      slug: "letras-de-crack",
      name: "Letras de Crack",
      category: "LETRAS" as const,
      emoji: "🧩",
      color: "#a855f7",
      description: "Ordena las letras para formar la palabra",
      order: 2,
    },
    {
      id: "game-alimentacion",
      slug: "alimentacion",
      name: "Alimentación",
      category: "ALIMENTACION" as const,
      emoji: "🍎",
      color: "#f97316",
      description: "Arrastra alimentos a saludable/no saludable y escucha su pronunciación",
      order: 3,
    },
  ];

  const gameIds: Record<string, string> = {};
  for (const game of games) {
    const saved = await prisma.game.upsert({
      where: { id: game.id },
      update: {
        slug: game.slug,
        name: game.name,
        category: game.category,
        emoji: game.emoji,
        color: game.color,
        description: game.description,
        active: true,
        order: game.order,
      },
      create: { ...game, active: true },
    });
    gameIds[game.category] = saved.id;

    const existingGameLesson = await prisma.lesson.findFirst({ where: { gameId: saved.id }, select: { id: true } });
    if (existingGameLesson) {
      await prisma.lesson.update({
        where: { id: existingGameLesson.id },
        data: {
          title: game.name,
          description: game.description ?? `Juego vinculado a la lección "${game.name}".`,
          emoji: game.emoji,
          color: game.color,
          type: "GAME",
          xpReward: 25,
          order: 100,
        },
      });
    } else {
      await prisma.lesson.create({
        data: {
          title: game.name,
          description: game.description ?? `Juego vinculado a la lección "${game.name}".`,
          emoji: game.emoji,
          color: game.color,
          type: "GAME",
          xpReward: 25,
          order: 100,
          gameId: saved.id,
        },
      });
    }

    console.log(`✔ Juego (${game.category}): ${game.name} (${game.slug})`);
  }

  const oidoWords: {
    id: string;
    word: string;
    label: string;
    language: string;
    options: { label: string; imageUrl: string; isCorrect: boolean }[];
  }[] = [
    {
      id: "oido-en-jersey",
      word: "jersey",
      label: "Camiseta",
      language: "en",
      options: [
        { label: "Camiseta", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: true },
        { label: "Pantaloneta", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: false },
        { label: "Botines", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: false },
        { label: "Medias largas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: false },
      ],
    },
    {
      id: "oido-en-shorts",
      word: "shorts",
      label: "Pantaloneta",
      language: "en",
      options: [
        { label: "Camiseta", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: false },
        { label: "Pantaloneta", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: true },
        { label: "Botines", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: false },
        { label: "Medias largas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: false },
      ],
    },
    {
      id: "oido-en-boots",
      word: "football boots",
      label: "Botines",
      language: "en",
      options: [
        { label: "Camiseta", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: false },
        { label: "Pantaloneta", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: false },
        { label: "Botines", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: true },
        { label: "Medias largas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: false },
      ],
    },
    {
      id: "oido-en-socks",
      word: "long socks",
      label: "Medias largas",
      language: "en",
      options: [
        { label: "Camiseta", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: false },
        { label: "Pantaloneta", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: false },
        { label: "Botines", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: false },
        { label: "Medias largas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: true },
      ],
    },
    {
      id: "oido-pt-camisa",
      word: "camisa",
      label: "Camisa",
      language: "pt",
      options: [
        { label: "Camisa", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: true },
        { label: "Calção", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: false },
        { label: "Chuteiras", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: false },
        { label: "Meias longas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: false },
      ],
    },
    {
      id: "oido-pt-chuteiras",
      word: "chuteiras",
      label: "Chuteiras",
      language: "pt",
      options: [
        { label: "Camisa", imageUrl: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", isCorrect: false },
        { label: "Calção", imageUrl: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", isCorrect: false },
        { label: "Chuteiras", imageUrl: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", isCorrect: true },
        { label: "Meias longas", imageUrl: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", isCorrect: false },
      ],
    },
  ];

  for (const [index, item] of oidoWords.entries()) {
    const word = await prisma.oidoCrackWord.upsert({
      where: { id: item.id },
      update: {
        gameId: gameIds.OIDO,
        word: item.word,
        label: item.label,
        language: item.language,
        active: true,
        order: index,
      },
      create: {
        id: item.id,
        gameId: gameIds.OIDO,
        word: item.word,
        label: item.label,
        language: item.language,
        active: true,
        order: index,
      },
    });
    await syncOidoOptions(word.id, item.options);
    console.log(`    ✔ Oído de Crack: ${item.word} (${item.language})`);
  }

  const golWords: {
    id: string;
    word: string;
    meaning: string;
    language: string;
    options: { label: string; isCorrect: boolean }[];
  }[] = [
    {
      id: "gol-en-forward",
      word: "forward",
      meaning: "Delantero",
      language: "en",
      options: [
        { label: "Delantero", isCorrect: true },
        { label: "Mediocampista", isCorrect: false },
        { label: "Defensa", isCorrect: false },
        { label: "Extremo", isCorrect: false },
      ],
    },
    {
      id: "gol-en-midfielder",
      word: "midfielder",
      meaning: "Mediocampista",
      language: "en",
      options: [
        { label: "Delantero", isCorrect: false },
        { label: "Mediocampista", isCorrect: true },
        { label: "Defensa", isCorrect: false },
        { label: "Extremo", isCorrect: false },
      ],
    },
    {
      id: "gol-en-defender",
      word: "defender",
      meaning: "Defensa",
      language: "en",
      options: [
        { label: "Delantero", isCorrect: false },
        { label: "Mediocampista", isCorrect: false },
        { label: "Defensa", isCorrect: true },
        { label: "Extremo", isCorrect: false },
      ],
    },
    {
      id: "gol-en-winger",
      word: "winger",
      meaning: "Extremo",
      language: "en",
      options: [
        { label: "Delantero", isCorrect: false },
        { label: "Mediocampista", isCorrect: false },
        { label: "Defensa", isCorrect: false },
        { label: "Extremo", isCorrect: true },
      ],
    },
    {
      id: "gol-pt-atacante",
      word: "atacante",
      meaning: "Atacante",
      language: "pt",
      options: [
        { label: "Atacante", isCorrect: true },
        { label: "Meio-campista", isCorrect: false },
        { label: "Defensor", isCorrect: false },
        { label: "Ponta", isCorrect: false },
      ],
    },
    {
      id: "gol-pt-meiocampista",
      word: "meio-campista",
      meaning: "Meio-campista",
      language: "pt",
      options: [
        { label: "Atacante", isCorrect: false },
        { label: "Meio-campista", isCorrect: true },
        { label: "Defensor", isCorrect: false },
        { label: "Ponta", isCorrect: false },
      ],
    },
    {
      id: "gol-pt-defensor",
      word: "defensor",
      meaning: "Defensor",
      language: "pt",
      options: [
        { label: "Atacante", isCorrect: false },
        { label: "Meio-campista", isCorrect: false },
        { label: "Defensor", isCorrect: true },
        { label: "Ponta", isCorrect: false },
      ],
    },
    {
      id: "gol-pt-ponta",
      word: "ponta",
      meaning: "Ponta",
      language: "pt",
      options: [
        { label: "Atacante", isCorrect: false },
        { label: "Meio-campista", isCorrect: false },
        { label: "Defensor", isCorrect: false },
        { label: "Ponta", isCorrect: true },
      ],
    },
  ];

  for (const [index, item] of golWords.entries()) {
    const word = await prisma.golPalabraWord.upsert({
      where: { id: item.id },
      update: {
        gameId: gameIds.GOL,
        word: item.word,
        meaning: item.meaning,
        language: item.language,
        active: true,
        order: index,
      },
      create: {
        id: item.id,
        gameId: gameIds.GOL,
        word: item.word,
        meaning: item.meaning,
        language: item.language,
        active: true,
        order: index,
      },
    });
    await syncGolOptions(word.id, item.options);
    console.log(`    ✔ Gol de Palabra: ${item.word} (${item.language})`);
  }

  const letrasWords: {
    id: string;
    word: string;
    meaning: string;
    language: string;
    imageUrl: string;
    letters: string[];
  }[] = [
    {
      id: "letras-en-rice",
      word: "rice",
      meaning: "Arroz",
      language: "en",
      imageUrl: "/game-assets/bilinguisimo/letras/rice-v1.png",
      letters: ["E", "A", "R", "I", "C", "O"],
    },
    {
      id: "letras-en-eggs",
      word: "eggs",
      meaning: "Huevos",
      language: "en",
      imageUrl: "/game-assets/bilinguisimo/letras/eggs-v1.png",
      letters: ["S", "E", "A", "G", "G", "O"],
    },
    {
      id: "letras-en-salad",
      word: "salad",
      meaning: "Ensalada",
      language: "en",
      imageUrl: "/game-assets/bilinguisimo/letras/salad-v1.png",
      letters: ["L", "S", "A", "O", "D", "A", "E"],
    },
    {
      id: "letras-en-soda",
      word: "soda",
      meaning: "Gaseosa",
      language: "en",
      imageUrl: "/game-assets/bilinguisimo/letras/soda-v1.png",
      letters: ["D", "A", "S", "E", "O", "I"],
    },
    {
      id: "letras-pt-arroz",
      word: "arroz",
      meaning: "Arroz",
      language: "pt",
      imageUrl: "/game-assets/bilinguisimo/letras/rice-v1.png",
      letters: ["O", "A", "R", "Z", "R", "I"],
    },
    {
      id: "letras-pt-ovos",
      word: "ovos",
      meaning: "Ovos",
      language: "pt",
      imageUrl: "/game-assets/bilinguisimo/letras/eggs-v1.png",
      letters: ["S", "O", "V", "A", "O", "E"],
    },
    {
      id: "letras-pt-salada",
      word: "salada",
      meaning: "Salada",
      language: "pt",
      imageUrl: "/game-assets/bilinguisimo/letras/salad-v1.png",
      letters: ["L", "S", "A", "D", "A", "E", "A"],
    },
    {
      id: "letras-pt-refrigerante",
      word: "refrigerante",
      meaning: "Refrigerante",
      language: "pt",
      imageUrl: "/game-assets/bilinguisimo/letras/soda-v1.png",
      letters: ["R", "E", "F", "R", "I", "G", "E", "R", "A", "N", "T", "E"],
    },
  ];

  for (const [index, item] of letrasWords.entries()) {
    await prisma.letrasCrackWord.upsert({
      where: { id: item.id },
      update: {
        gameId: gameIds.LETRAS,
        word: item.word,
        meaning: item.meaning,
        imageUrl: item.imageUrl,
        language: item.language,
        active: true,
        order: index,
        letters: item.letters,
      },
      create: {
        id: item.id,
        gameId: gameIds.LETRAS,
        word: item.word,
        meaning: item.meaning,
        imageUrl: item.imageUrl,
        language: item.language,
        active: true,
        order: index,
        letters: item.letters,
      },
    });
    console.log(`    ✔ Letras de Crack: ${item.word} (${item.language})`);
  }

  const alimentacionWords: {
    id: string;
    name: string;
    imageUrl: string;
    audioUrl: string | null;
    isHealthy: boolean;
    language: string;
  }[] = [
    {
      id: "alim-manzana",
      name: "Manzana",
      imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: true,
      language: "es",
    },
    {
      id: "alim-banana",
      name: "Banana",
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: true,
      language: "es",
    },
    {
      id: "alim-zanahoria",
      name: "Zanahoria",
      imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: true,
      language: "es",
    },
    {
      id: "alim-brocoli",
      name: "Brócoli",
      imageUrl: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: true,
      language: "es",
    },
    {
      id: "alim-pescado",
      name: "Pescado",
      imageUrl: "https://images.unsplash.com/photo-1544943910-4c1dc44a2e85?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: true,
      language: "es",
    },
    {
      id: "alim-hamburguesa",
      name: "Hamburguesa",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: false,
      language: "es",
    },
    {
      id: "alim-papas-fritas",
      name: "Papas fritas",
      imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: false,
      language: "es",
    },
    {
      id: "alim-refresco",
      name: "Refresco",
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: false,
      language: "es",
    },
    {
      id: "alim-donut",
      name: "Donut",
      imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: false,
      language: "es",
    },
    {
      id: "alim-dulces",
      name: "Dulces",
      imageUrl: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=400&fit=crop",
      audioUrl: null,
      isHealthy: false,
      language: "es",
    },
  ];

  for (const [index, item] of alimentacionWords.entries()) {
    await prisma.alimentacionWord.upsert({
      where: { id: item.id },
      update: {
        gameId: gameIds.ALIMENTACION,
        name: item.name,
        imageUrl: item.imageUrl,
        audioUrl: item.audioUrl,
        isHealthy: item.isHealthy,
        language: item.language,
        active: true,
        order: index,
      },
      create: {
        id: item.id,
        gameId: gameIds.ALIMENTACION,
        name: item.name,
        imageUrl: item.imageUrl,
        audioUrl: item.audioUrl,
        isHealthy: item.isHealthy,
        language: item.language,
        active: true,
        order: index,
      },
    });
    console.log(`    ✔ Alimentación: ${item.name} (${item.isHealthy ? "saludable" : "no saludable"})`);
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());