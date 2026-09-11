import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { INITIAL_STREAK_COMPONENT_CONFIG, INITIAL_STREAK_WEIGHTS } from "../src/config/domain-rules";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VERSION = "v1";
const CREATED_BY = "seed-domain";

const SPORT_DIMENSIONS: { key: string; label: string; description: string }[] = [
  { key: "OFFENSIVE", label: "Ofensivo", description: "Acciones ofensivas, finalización y juego de ataque." },
  { key: "DEFENSIVE", label: "Defensivo", description: "Marcaje, coberturas y juego defensivo." },
  { key: "TECHNIQUE", label: "Técnica", description: "Control, pase, conducción y fundamento técnico." },
  { key: "SPEED", label: "Velocidad", description: "Velocidad de desplazamiento y de reacción." },
  { key: "GAME_READING", label: "Lectura de juego", description: "Lectura, anticipación y toma de decisiones en el juego." },
  { key: "POLYFUNCTIONALITY", label: "Polifuncionalidad", description: "Capacidad de desempeñarse en distintas funciones." },
];

const NEURO_DIMENSIONS: { key: string; label: string; description: string }[] = [
  { key: "BILINGUAL_SPORT", label: "Bilingüismo Sport", description: "Comunicación y desempeño en contexto deportivo bilingüe." },
  { key: "LEADERSHIP", label: "Liderazgo", description: "Influencia, guía y ejemplo dentro del equipo." },
  { key: "MINDSET", label: "Mentalidad", description: "Resiliencia, foco y actitud competitiva." },
  { key: "SPORTS_FINANCE", label: "Finanzas Sport", description: "Comprensión de la industria y del valor deportivo." },
  { key: "SUSTAINABILITY", label: "Sostenibilidad", description: "Conciencia y acción ambiental, como el aporte PET." },
  { key: "WELLBEING", label: "Bienestar", description: "Cuidado físico, emocional y hábitos saludables." },
];

async function seedDimensions(): Promise<void> {
  const all = [
    ...SPORT_DIMENSIONS.map((dimension, index) => ({
      ...dimension,
      group: "SPORT" as const,
      sortOrder: index + 1,
    })),
    ...NEURO_DIMENSIONS.map((dimension, index) => ({
      ...dimension,
      group: "NEUROCRACKS" as const,
      sortOrder: index + 1,
    })),
  ];

  for (const dimension of all) {
    await prisma.evaluationDimensionDefinition.upsert({
      where: { key_version: { key: dimension.key, version: VERSION } },
      update: {
        group: dimension.group,
        label: dimension.label,
        description: dimension.description,
        sortOrder: dimension.sortOrder,
        active: true,
      },
      create: {
        key: dimension.key,
        version: VERSION,
        group: dimension.group,
        label: dimension.label,
        description: dimension.description,
        sortOrder: dimension.sortOrder,
        active: true,
      },
    });
  }
}

async function seedScoreFormula(): Promise<void> {
  await prisma.scoreFormulaVersion.upsert({
    where: { version: VERSION },
    update: {},
    create: {
      version: VERSION,
      sportWeight: "0.5000",
      neuroWeight: "0.5000",
      config: {},
      effectiveFrom: new Date(),
      effectiveTo: null,
      status: "ACTIVE",
      createdBy: CREATED_BY,
    },
  });
}

async function seedStreakRule(): Promise<void> {
  await prisma.streakRuleVersion.upsert({
    where: { version: VERSION },
    update: {},
    create: {
      version: VERSION,
      attendanceWeight: String(INITIAL_STREAK_WEIGHTS.attendance),
      neurocracksWeight: String(INITIAL_STREAK_WEIGHTS.neurocracks),
      challengeWeight: String(INITIAL_STREAK_WEIGHTS.challenge),
      petWeight: String(INITIAL_STREAK_WEIGHTS.pet),
      validationWeight: String(INITIAL_STREAK_WEIGHTS.validation),
      componentConfig: { ...INITIAL_STREAK_COMPONENT_CONFIG },
      verifiedWeekThreshold: null,
      effectiveFrom: new Date(),
      effectiveTo: null,
      status: "ACTIVE",
      createdBy: CREATED_BY,
    },
  });
}

async function main(): Promise<void> {
  await seedDimensions();
  await seedScoreFormula();
  await seedStreakRule();
  console.log("Seed domain completado (dimensiones, rúbrica y reglas v1).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });