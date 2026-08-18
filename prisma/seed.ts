import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type QuestionSeed = {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  explanation?: string;
  timeSeconds?: number;
  options: { text: string; isCorrect?: boolean }[];
};

type LessonSeed = {
  title: string;
  description: string;
  emoji: string;
  color: string;
  type: "LESSON" | "QUIZ" | "GAME";
  gameMode?: "ANAGRAM" | null;
  xpReward: number;
  questions: QuestionSeed[];
};

const lessons: LessonSeed[] = [
  {
    title: "Reglas básicas del fútbol",
    description: "Aprende las reglas fundamentales del deporte rey.",
    emoji: "⚽",
    color: "#16a34a",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuántos jugadores de campo tiene cada equipo durante un partido?",
        explanation: "Son 11 por equipo, incluido el portero. De ahí el nombre '11Cracks'.",
        options: [
          { text: "10" },
          { text: "11", isCorrect: true },
          { text: "12" },
          { text: "9" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuánto dura un partido de fútbol profesional en tiempo reglamentario?",
        explanation: "90 minutos divididos en dos tiempos de 45 minutos, más el descuento.",
        options: [
          { text: "80 minutos" },
          { text: "100 minutos" },
          { text: "90 minutos", isCorrect: true },
          { text: "120 minutos" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El único jugador que puede usar las manos en su área es el portero.",
        explanation: "Correcto. El portero puede usar las manos dentro de su área penal.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué sucede si el balón cruza completamente la línea de meta fuera de la portería?",
        explanation: "Si lo toca por último un atacante es saque de meta; si lo toca un defensor es córner.",
        options: [
          { text: "Saque de banda" },
          { text: "Córner o saque de meta, según quién tocó el balón", isCorrect: true },
          { text: "Tiro libre" },
          { text: "Penalti" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué árbitro adicional revisa las jugadas con video en los partidos grandes?",
        explanation: "El VAR (Video Assistant Referee) asiste al árbitro principal.",
        options: [
          { text: "El cuarto árbitro" },
          { text: "El VAR", isCorrect: true },
          { text: "El juez de línea" },
          { text: "El delegado" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "Un saque de banda se cobra con los pies.",
        explanation: "El saque de banda se realiza con las manos, por encima de la cabeza.",
        options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }],
      },
    ],
  },
  {
    title: "Las posiciones",
    description: "Conoce el rol de cada jugador en el campo.",
    emoji: "🧤",
    color: "#2563eb",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué jugador está autorizado a usar las manos dentro del área?",
        explanation: "El portero o guardameta es el único autorizado dentro de su área.",
        options: [
          { text: "El delantero" },
          { text: "El defensa central" },
          { text: "El portero", isCorrect: true },
          { text: "El mediocampista" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cómo se llama el jugador que se ubica entre los defensas y los delanteros?",
        explanation: "El mediocampista conecta la defensa con el ataque.",
        options: [
          { text: "Extremo" },
          { text: "Mediocampista", isCorrect: true },
          { text: "Portero" },
          { text: "Lateral" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué posición juega normalmente en las bandas cerca del área rival?",
        explanation: "El extremo o volante ofensivo juega pegado a las bandas para desbordar.",
        options: [
          { text: "Extremo", isCorrect: true },
          { text: "Central" },
          { text: "Portero" },
          { text: "Mediocentro defensivo" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El 9 suele ser el delantero centro o 'referente de área'.",
        explanation: "El dorsal 9 clásico es el delantero centro que define en el área.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué jugador cubre las bandas en defensa y apoya en ataque?",
        explanation: "El lateral recorre la banda ayudando en defensa y en ataque.",
        options: [
          { text: "Lateral", isCorrect: true },
          { text: "Portero" },
          { text: "Delantero centro" },
          { text: "Central" },
        ],
      },
    ],
  },
  {
    title: "El fuera de juego",
    description: "Domina la regla más polémica del fútbol.",
    emoji: "🚩",
    color: "#d97706",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "TRUE_FALSE",
        prompt: "Estás en fuera de juego si estás más cerca de la portería rival que el balón y el penúltimo defensor.",
        explanation: "El fuera de juego se marca al estar por delante del balón y del penúltimo rival.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿En qué momento se sanciona el fuera de juego?",
        explanation: "Solo se sanciona cuando el jugador participa de la jugada: recibe, toca o interfiere.",
        options: [
          { text: "En cualquier momento" },
          { text: "Solo al recibir el balón de un rival" },
          { text: "Cuando participa en la jugada recibiendo o interfiriendo", isCorrect: true },
          { text: "Nunca se sanciona" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Se puede estar en fuera de juego en un saque de esquina?",
        explanation: "No. En córner, saque de banda y saque de meta no hay fuera de juego.",
        options: [
          { text: "Sí, siempre" },
          { text: "No, en el córner no existe fuera de juego", isCorrect: true },
          { text: "Solo en la primera jugada" },
          { text: "Depende del árbitro" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "Si un jugador está en posición adelantada pero no toca el balón, puede seguir la jugada.",
        explanation: "Si no participa, no hay infracción, aunque los árbitros pueden marcar si interfiere con el rival.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
    ],
  },
  {
    title: "Faltas y tarjetas",
    description: "Aprende a distinguir faltas, tarjetas y sanciones.",
    emoji: "🟨",
    color: "#dc2626",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué significan dos tarjetas amarillas para el mismo jugador?",
        explanation: "Dos amarillas en un partido equivalen a expulsión (tarjeta roja).",
        options: [
          { text: "Nada" },
          { text: "Amonestación y sanción económica" },
          { text: "Expulsión", isCorrect: true },
          { text: "Cambio de posición" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuándo se sanciona un penalti?",
        explanation: "Cuando se comete una falta sancionable con tiro libre dentro del área penal.",
        options: [
          { text: "Cuando la falta es dentro del área penal", isCorrect: true },
          { text: "En cualquier falta del partido" },
          { text: "Solo en el último minuto" },
          { text: "Cuando el portero sale del área" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El árbitro puede mostrar una tarjeta roja directa por una falta violenta.",
        explanation: "Las faltas violentas o el juego peligroso grave se castigan con expulsión directa.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué es una 'falta táctica'?",
        explanation: "Es cortar un ataque rival de forma deliberada, generalmente se castiga con amarilla.",
        options: [
          { text: "Cortar un contraataque rival a propósito", isCorrect: true },
          { text: "Una falta dentro del área" },
          { text: "Un pase largo" },
          { text: "Un cambio de jugador" },
        ],
      },
    ],
  },
  {
    title: "Los grandes torneos",
    description: "El Mundial, la Champions y más competencias legendarias.",
    emoji: "🏆",
    color: "#9333ea",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cada cuántos años se juega el Mundial de la FIFA?",
        explanation: "Históricamente cada 4 años. A partir de 2026 cambió a 4 años también (48 selecciones).",
        options: [
          { text: "Cada 2 años" },
          { text: "Cada 4 años", isCorrect: true },
          { text: "Cada 3 años" },
          { text: "Cada año" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué torneo reúne a los mejores clubes de Europa?",
        explanation: "La UEFA Champions League es el torneo de clubes más prestigioso de Europa.",
        options: [
          { text: "La Copa América" },
          { text: "La UEFA Champions League", isCorrect: true },
          { text: "El Mundial de Clubes" },
          { text: "La Liga de Naciones" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué selección ganó el Mundial de Qatar 2022?",
        explanation: "Argentina venció a Francia en una final legendaria por penales.",
        options: [
          { text: "Francia" },
          { text: "Brasil" },
          { text: "Argentina", isCorrect: true },
          { text: "España" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El Mundial de 2026 se jugará en Estados Unidos, México y Canadá.",
        explanation: "Es el primer Mundial organizado por tres países, con 48 selecciones.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cómo se llama el torneo continental más importante de Sudamérica?",
        explanation: "La Copa América es el torneo de selecciones más antiguo del mundo.",
        options: [
          { text: "Copa América", isCorrect: true },
          { text: "Copa Libertadores" },
          { text: "Sudamericano" },
          { text: "Mundialito" },
        ],
      },
    ],
  },
  {
    title: "Estrategia y táctica",
    description: "Formaciones, pressing y conceptos tácticos básicos.",
    emoji: "🧠",
    color: "#0891b2",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "En la formación 4-4-2, ¿cuántos delanteros hay?",
        explanation: "4 defensas, 4 mediocampistas y 2 delanteros.",
        options: [
          { text: "1" },
          { text: "2", isCorrect: true },
          { text: "3" },
          { text: "4" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué es el 'pressing alto'?",
        explanation: "Presionar al rival en su propio campo para recuperar el balón rápido.",
        options: [
          { text: "Defender en tu propia área" },
          { text: "Presionar al rival cerca de su portería", isCorrect: true },
          { text: "Jugar con un solo delantero" },
          { text: "Esperar el error rival sin salir" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "La 'posesión' mide el tiempo que un equipo mantiene el control del balón.",
        explanation: "La posesión es el porcentaje del tiempo en que un equipo controla el balón.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué significa 'contraataque'?",
        explanation: "Es atacar rápido tras recuperar el balón, aprovechando que el rival está descolocado.",
        options: [
          { text: "Atacar rápido tras robar el balón", isCorrect: true },
          { text: "Defender con todos los jugadores" },
          { text: "Tocar el balón sin avanzar" },
          { text: "Un cambio de portero" },
        ],
      },
    ],
  },

  {
    title: "Quiz relámpago",
    description: "Preguntas rápidas para calentar tu mente.",
    emoji: "🎯",
    color: "#16a34a",
    type: "GAME",
    xpReward: 10,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué país ganó la Eurocopa 2024?",
        explanation: "España se coronó campeona de la Euro 2024 en Berlín.",
        options: [{ text: "España", isCorrect: true }, { text: "Inglaterra" }, { text: "Francia" }, { text: "Italia" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Quién ganó el Balón de Oro 2024?",
        explanation: "Rodri Hernández fue galardonado tras ganar la Euro y la Premier.",
        options: [{ text: "Vinicius Jr." }, { text: "Rodri", isCorrect: true }, { text: "Bellingham" }, { text: "Mbappé" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué club juega en el estadio Camp Nou?",
        explanation: "El Camp Nou (ahora Spotify Camp Nou) es la casa del FC Barcelona.",
        options: [{ text: "Real Madrid" }, { text: "FC Barcelona", isCorrect: true }, { text: "Atlético de Madrid" }, { text: "Sevilla" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué país tiene más Copas del Mundo?",
        explanation: "Brasil lidera con 5 títulos mundiales.",
        options: [{ text: "Alemania" }, { text: "Argentina" }, { text: "Brasil", isCorrect: true }, { text: "Italia" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué jugador es apodado 'La Pulga'?",
        explanation: "Lionel Messi es conocido mundialmente como 'La Pulga'.",
        options: [{ text: "Neymar" }, { text: "Lionel Messi", isCorrect: true }, { text: "Cristiano Ronaldo" }, { text: "Suárez" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cómo se llama el trofeo que levanta el campeón de la Champions League?",
        explanation: "La 'Orejona' es el apodo del trofeo de la UEFA Champions League.",
        options: [{ text: "La Orejona", isCorrect: true }, { text: "La Copa" }, { text: "El Dorado" }, { text: "El Oso" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué selección ganó la Copa América 2024?",
        explanation: "Argentina se consagró bicampeona de América en Miami.",
        options: [{ text: "Colombia" }, { text: "Uruguay" }, { text: "Argentina", isCorrect: true }, { text: "Brasil" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿En qué país nació Pelé?",
        explanation: "Pelé nació en Três Corações, Brasil.",
        options: [{ text: "Argentina" }, { text: "Brasil", isCorrect: true }, { text: "Uruguay" }, { text: "Portugal" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué equipo inglés tiene más Champions League?",
        explanation: "El Liverpool es el club inglés con más Copas de Europa (6).",
        options: [{ text: "Manchester City" }, { text: "Chelsea" }, { text: "Liverpool", isCorrect: true }, { text: "Arsenal" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué arquero argentino ganó el Mundial 2022 y fue clave en los penales?",
        explanation: "Emiliano 'Dibu' Martínez fue figura atajando en la tanda final.",
        options: [{ text: "Emiliano Martínez", isCorrect: true }, { text: "Romero" }, { text: "Musso" }, { text: "Armani" }],
        timeSeconds: 8,
      },
    ],
  },

  {
    title: "Crack test",
    description: "Afirmaciones rápidas de verdadero o falso.",
    emoji: "⚡",
    color: "#d97706",
    type: "GAME",
    xpReward: 10,
    questions: [
      { type: "TRUE_FALSE", prompt: "El fútbol se juega con 11 jugadores por equipo.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El penalti se cobra desde 11 metros.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Messi ganó el Mundial 2022 con Argentina.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "La Champions League es un torneo de selecciones.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El Real Madrid es el club con más Champions de la historia.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Un córner se cobra desde la línea de fondo.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Pelé nació en Portugal.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "La Copa América es más antigua que el Mundial.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El árbitro puede expulsar directamente con tarjeta roja.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Un partido de fútbol dura 120 minutos sin descuento.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El 'hat-trick' son 3 goles en un mismo partido.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Inglaterra ganó la Eurocopa 2024.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
    ],
  },

  {
    title: "Técnica: el pase",
    description: "Perfecciona la base de todo equipo: pasar el balón.",
    emoji: "👟",
    color: "#16a34a",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué parte del pie se usa para un pase corto preciso?",
        explanation: "El interior del pie da mayor precisión y control al pase corto.",
        options: [{ text: "El empeine" }, { text: "El interior del pie", isCorrect: true }, { text: "El talón" }, { text: "La punta" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué tipo de pase se usa para superar a un rival a distancia?",
        explanation: "El pase largo o en profundidad busca romper líneas y llegar lejos.",
        options: [{ text: "Pase largo o en profundidad", isCorrect: true }, { text: "Pase corto" }, { text: "Pase de tacón" }, { text: "Saque de banda" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El pase con el interior del pie es más preciso que el de empeine.",
        explanation: "El interior ofrece mayor superficie de contacto y control.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuál es el error más común al pasar?",
        explanation: "Mirar fijamente el balón impide leer el movimiento de los compañeros.",
        options: [
          { text: "Mirar al balón en lugar de a los compañeros", isCorrect: true },
          { text: "Patear demasiado fuerte" },
          { text: "Patear con el interior" },
          { text: "Tocar el balón dos veces" },
        ],
      },
    ],
  },

  {
    title: "Técnica: control y recepción",
    description: "Domina el balón al primer toque.",
    emoji: "🎯",
    color: "#2563eb",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuál es la clave para un buen control de balón?",
        explanation: "La 'amortiguación': ceder ligeramente al recibir para que el balón no rebote.",
        options: [{ text: "Ceder y amortiguar el impacto", isCorrect: true }, { text: "Golpear fuerte el balón" }, { text: "Cerrar los ojos" }, { text: "Saltar" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El control orientado permite recibir y encarar en un solo movimiento.",
        explanation: "El control orientado deja el balón listo para el siguiente pase o disparo.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué parte del cuerpo se usa para controlar un balón que viene por alto?",
        explanation: "El pecho es ideal para amortiguar balones aéreos y dejarlos cerca de los pies.",
        options: [{ text: "El pecho", isCorrect: true }, { text: "La rodilla siempre" }, { text: "La cabeza siempre" }, { text: "Las manos" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué error rompe el control del balón en movimiento?",
        explanation: "Pie de apoyo mal colocado te desequilibra y pierdes el control.",
        options: [{ text: "Pie de apoyo mal colocado", isCorrect: true }, { text: "Mirar al arco" }, { text: "Tener los brazos abiertos" }, { text: "Respirar" }],
      },
    ],
  },

  {
    title: "Entrenamiento: defensa 1 vs 1",
    description: "Aprende a defender en duelos individuales.",
    emoji: "🛡️",
    color: "#dc2626",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuál es la postura ideal al defender 1 vs 1?",
        explanation: "Cuerpo bajo, rodillas flexionadas y presión lateral sobre el balón.",
        options: [{ text: "De pie y muy recto" }, { text: "Cuerpo bajo y lateral, presionando el balón", isCorrect: true }, { text: "De espaldas al atacante" }, { text: "Corriendo al arco" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué NO debes hacer al defender un regate?",
        explanation: "Ir a 'lancero' (entrar de frente) te hace perder el equilibrio fácilmente.",
        options: [{ text: "Entrar de frente sin control", isCorrect: true }, { text: "Esperar el movimiento del rival" }, { text: "Presionar lateral" }, { text: "Mantener la distancia" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El defensor debe observar el balón y la posición del atacante a la vez.",
        explanation: "Leer el balón y al rival permite anticipar el movimiento.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Cuándo es buen momento para intentar quitar el balón?",
        explanation: "Al controlar mal o cuando el rival golpea el balón más lejos de su pie.",
        options: [
          { text: "Cuando el rival golpea el balón fuera de su control", isCorrect: true },
          { text: "Nunca" },
          { text: "Solo al inicio del partido" },
          { text: "Cuando está de espaldas" },
        ],
      },
    ],
  },

  {
    title: "Quiz: goleadores históricos",
    description: "¿Cuánto sabes de los artilleros del fútbol?",
    emoji: "🥅",
    color: "#9333ea",
    type: "QUIZ",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Quién es el máximo goleador histórico de las Copas del Mundo?",
        explanation: "Miroslav Klose marcó 16 goles en mundiales, superando a Ronaldo Nazário.",
        options: [{ text: "Miroslav Klose", isCorrect: true }, { text: "Ronaldo Nazário" }, { text: "Pelé" }, { text: "Messi" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Quién ganó el Balón de Oro 2022?",
        explanation: "Karim Benzema lo ganó tras su temporada histórica con el Real Madrid.",
        options: [{ text: "Karim Benzema", isCorrect: true }, { text: "Messi" }, { text: "Mbappé" }, { text: "Cristiano Ronaldo" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "Pelé marcó más de 1000 goles en su carrera.",
        explanation: "Pelé superó la barrera de los 1000 goles, hito histórico.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Qué jugador es conocido como 'el Fenómeno'?",
        explanation: "Ronaldo Nazário, 'R9', fue apodado 'el Fenómeno'.",
        options: [{ text: "Ronaldo Nazário", isCorrect: true }, { text: "Cristiano Ronaldo" }, { text: "Romario" }, { text: "Van Nistelrooy" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "¿Quién es el máximo goleador de la Champions League?",
        explanation: "Cristiano Ronaldo lidera con 140 goles en la Champions.",
        options: [{ text: "Cristiano Ronaldo", isCorrect: true }, { text: "Messi" }, { text: "Lewandowski" }, { text: "Benzema" }],
      },
    ],
  },
  {
    title: "Palabras en juego",
    description: "Ordena las letras para formar la palabra en inglés. A menor tiempo, más goles.",
    emoji: "🔤",
    color: "#0891b2",
    type: "GAME",
    gameMode: "ANAGRAM",
    xpReward: 20,
    questions: [
      { type: "MULTIPLE_CHOICE", prompt: "GOAL", explanation: "Gol", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "PENALTY", explanation: "Penal", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "MATCH", explanation: "Partido", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "TEAM", explanation: "Equipo", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "COACH", explanation: "Entrenador", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "STADIUM", explanation: "Estadio", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "PLAYER", explanation: "Jugador", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "DEFENSE", explanation: "Defensa", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "FORWARD", explanation: "Delantero", options: [] },
      { type: "MULTIPLE_CHOICE", prompt: "CHAMPION", explanation: "Campeón", options: [] },
    ],
  },
];

const temas: { name: string; emoji: string; color: string; xpReward: number }[] = [
  { name: "Training sport", emoji: "💪", color: "#16a34a", xpReward: 60 },
  { name: "Gastronomía sport", emoji: "🍽️", color: "#d97706", xpReward: 60 },
  { name: "Día de Hotel", emoji: "🏨", color: "#2563eb", xpReward: 60 },
  { name: "Descansar", emoji: "😴", color: "#0891b2", xpReward: 60 },
  { name: "Día de juego", emoji: "🏟️", color: "#9333ea", xpReward: 60 },
];

const clases: {
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
];

const TEMA_CLASES: Record<string, string> = {
  "stage-1": "subject-futbol",
  "stage-2": "subject-cultura",
  "stage-3": "subject-futbol",
  "stage-4": "subject-cultura",
  "stage-5": "subject-futbol",
};

const STAGE_SIZES = [3, 3, 2, 2, 2];

async function main() {
  const existing = await prisma.lesson.count();

  for (const clase of clases) {
    await prisma.clase.upsert({
      where: { id: clase.id },
      update: {
        name: clase.name,
        description: clase.description,
        emoji: clase.emoji,
        color: clase.color,
        order: clase.order,
      },
      create: {
        id: clase.id,
        name: clase.name,
        description: clase.description,
        emoji: clase.emoji,
        color: clase.color,
        order: clase.order,
      },
    });
  }

  const stageRows = await Promise.all(
    temas.map((s, i) =>
      prisma.tema.upsert({
        where: { id: `stage-${i + 1}` },
        update: {
          name: s.name,
          emoji: s.emoji,
          color: s.color,
          xpReward: s.xpReward,
          claseId: TEMA_CLASES[`stage-${i + 1}`],
        },
        create: {
          id: `stage-${i + 1}`,
          name: s.name,
          emoji: s.emoji,
          color: s.color,
          order: i,
          xpReward: s.xpReward,
          claseId: TEMA_CLASES[`stage-${i + 1}`],
        },
      })
    )
  );

  const temaIdFor = (lessonIndex: number) => {
    let acc = 0;
    for (let i = 0; i < STAGE_SIZES.length; i++) {
      acc += STAGE_SIZES[i];
      if (lessonIndex < acc) return stageRows[i]?.id ?? null;
    }
    return stageRows[stageRows.length - 1]?.id ?? null;
  };

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      username: "admin11",
      name: "Admin",
      role: "ADMIN",
      password: await bcrypt.hash("admin123", 10),
    },
    create: {
      email: "admin@gmail.com",
      username: "admin11",
      name: "Admin",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      xp: 120,
    },
  });
  console.log(`✔ Cuenta admin: ${admin.email} (${admin.role})`);

  if (existing > 0) {
    const dbLessons = await prisma.lesson.findMany({ orderBy: { order: "asc" } });
    let assigned = 0;
    for (const [i, lesson] of dbLessons.entries()) {
      const temaId = temaIdFor(i);
      if (lesson.temaId !== temaId) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { temaId } });
        assigned += 1;
      }
    }
    console.log(`Ya hay ${existing} lecciones. Temas asignados: ${assigned}. Seed omitido.`);
    return;
  }

  let order = 0;
  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        title: lesson.title,
        description: lesson.description,
        emoji: lesson.emoji,
        color: lesson.color,
        type: lesson.type,
        gameMode: lesson.gameMode ?? null,
        xpReward: lesson.xpReward,
        order,
        temaId: temaIdFor(order),
        questions: {
          create: lesson.questions.map((q, qi) => ({
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            timeSeconds: q.timeSeconds,
            order: qi,
            options: {
              create: q.options.map((o, oi) => ({
                text: o.text,
                isCorrect: o.isCorrect ?? false,
                order: oi,
              })),
            },
          })),
        },
      },
    });
    order += 1;
    console.log(`✔ Lección: ${lesson.title}`);
  }

  console.log(`Seed completado: ${lessons.length} lecciones creadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
