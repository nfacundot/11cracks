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
    title: "Reglas bÃ¡sicas del fÃºtbol",
    description: "Aprende las reglas fundamentales del deporte rey.",
    emoji: "âš½",
    color: "#16a34a",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡ntos jugadores de campo tiene cada equipo durante un partido?",
        explanation: "Son 11 por equipo, incluido el portero. De ahÃ­ el nombre '11Cracks'.",
        options: [
          { text: "10" },
          { text: "11", isCorrect: true },
          { text: "12" },
          { text: "9" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡nto dura un partido de fÃºtbol profesional en tiempo reglamentario?",
        explanation: "90 minutos divididos en dos tiempos de 45 minutos, mÃ¡s el descuento.",
        options: [
          { text: "80 minutos" },
          { text: "100 minutos" },
          { text: "90 minutos", isCorrect: true },
          { text: "120 minutos" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El Ãºnico jugador que puede usar las manos en su Ã¡rea es el portero.",
        explanation: "Correcto. El portero puede usar las manos dentro de su Ã¡rea penal.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© sucede si el balÃ³n cruza completamente la lÃ­nea de meta fuera de la porterÃ­a?",
        explanation: "Si lo toca por Ãºltimo un atacante es saque de meta; si lo toca un defensor es cÃ³rner.",
        options: [
          { text: "Saque de banda" },
          { text: "CÃ³rner o saque de meta, segÃºn quiÃ©n tocÃ³ el balÃ³n", isCorrect: true },
          { text: "Tiro libre" },
          { text: "Penalti" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© Ã¡rbitro adicional revisa las jugadas con video en los partidos grandes?",
        explanation: "El VAR (Video Assistant Referee) asiste al Ã¡rbitro principal.",
        options: [
          { text: "El cuarto Ã¡rbitro" },
          { text: "El VAR", isCorrect: true },
          { text: "El juez de lÃ­nea" },
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
    emoji: "ðŸ§¤",
    color: "#2563eb",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© jugador estÃ¡ autorizado a usar las manos dentro del Ã¡rea?",
        explanation: "El portero o guardameta es el Ãºnico autorizado dentro de su Ã¡rea.",
        options: [
          { text: "El delantero" },
          { text: "El defensa central" },
          { text: "El portero", isCorrect: true },
          { text: "El mediocampista" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CÃ³mo se llama el jugador que se ubica entre los defensas y los delanteros?",
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
        prompt: "Â¿QuÃ© posiciÃ³n juega normalmente en las bandas cerca del Ã¡rea rival?",
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
        prompt: "El 9 suele ser el delantero centro o 'referente de Ã¡rea'.",
        explanation: "El dorsal 9 clÃ¡sico es el delantero centro que define en el Ã¡rea.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© jugador cubre las bandas en defensa y apoya en ataque?",
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
    description: "Domina la regla mÃ¡s polÃ©mica del fÃºtbol.",
    emoji: "ðŸš©",
    color: "#d97706",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "TRUE_FALSE",
        prompt: "EstÃ¡s en fuera de juego si estÃ¡s mÃ¡s cerca de la porterÃ­a rival que el balÃ³n y el penÃºltimo defensor.",
        explanation: "El fuera de juego se marca al estar por delante del balÃ³n y del penÃºltimo rival.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿En quÃ© momento se sanciona el fuera de juego?",
        explanation: "Solo se sanciona cuando el jugador participa de la jugada: recibe, toca o interfiere.",
        options: [
          { text: "En cualquier momento" },
          { text: "Solo al recibir el balÃ³n de un rival" },
          { text: "Cuando participa en la jugada recibiendo o interfiriendo", isCorrect: true },
          { text: "Nunca se sanciona" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿Se puede estar en fuera de juego en un saque de esquina?",
        explanation: "No. En cÃ³rner, saque de banda y saque de meta no hay fuera de juego.",
        options: [
          { text: "SÃ­, siempre" },
          { text: "No, en el cÃ³rner no existe fuera de juego", isCorrect: true },
          { text: "Solo en la primera jugada" },
          { text: "Depende del Ã¡rbitro" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "Si un jugador estÃ¡ en posiciÃ³n adelantada pero no toca el balÃ³n, puede seguir la jugada.",
        explanation: "Si no participa, no hay infracciÃ³n, aunque los Ã¡rbitros pueden marcar si interfiere con el rival.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
    ],
  },
  {
    title: "Faltas y tarjetas",
    description: "Aprende a distinguir faltas, tarjetas y sanciones.",
    emoji: "ðŸŸ¨",
    color: "#dc2626",
    type: "LESSON",
    xpReward: 20,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© significan dos tarjetas amarillas para el mismo jugador?",
        explanation: "Dos amarillas en un partido equivalen a expulsiÃ³n (tarjeta roja).",
        options: [
          { text: "Nada" },
          { text: "AmonestaciÃ³n y sanciÃ³n econÃ³mica" },
          { text: "ExpulsiÃ³n", isCorrect: true },
          { text: "Cambio de posiciÃ³n" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡ndo se sanciona un penalti?",
        explanation: "Cuando se comete una falta sancionable con tiro libre dentro del Ã¡rea penal.",
        options: [
          { text: "Cuando la falta es dentro del Ã¡rea penal", isCorrect: true },
          { text: "En cualquier falta del partido" },
          { text: "Solo en el Ãºltimo minuto" },
          { text: "Cuando el portero sale del Ã¡rea" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El Ã¡rbitro puede mostrar una tarjeta roja directa por una falta violenta.",
        explanation: "Las faltas violentas o el juego peligroso grave se castigan con expulsiÃ³n directa.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© es una 'falta tÃ¡ctica'?",
        explanation: "Es cortar un ataque rival de forma deliberada, generalmente se castiga con amarilla.",
        options: [
          { text: "Cortar un contraataque rival a propÃ³sito", isCorrect: true },
          { text: "Una falta dentro del Ã¡rea" },
          { text: "Un pase largo" },
          { text: "Un cambio de jugador" },
        ],
      },
    ],
  },
  {
    title: "Los grandes torneos",
    description: "El Mundial, la Champions y mÃ¡s competencias legendarias.",
    emoji: "ðŸ†",
    color: "#9333ea",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿Cada cuÃ¡ntos aÃ±os se juega el Mundial de la FIFA?",
        explanation: "HistÃ³ricamente cada 4 aÃ±os. A partir de 2026 cambiÃ³ a 4 aÃ±os tambiÃ©n (48 selecciones).",
        options: [
          { text: "Cada 2 aÃ±os" },
          { text: "Cada 4 aÃ±os", isCorrect: true },
          { text: "Cada 3 aÃ±os" },
          { text: "Cada aÃ±o" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© torneo reÃºne a los mejores clubes de Europa?",
        explanation: "La UEFA Champions League es el torneo de clubes mÃ¡s prestigioso de Europa.",
        options: [
          { text: "La Copa AmÃ©rica" },
          { text: "La UEFA Champions League", isCorrect: true },
          { text: "El Mundial de Clubes" },
          { text: "La Liga de Naciones" },
        ],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© selecciÃ³n ganÃ³ el Mundial de Qatar 2022?",
        explanation: "Argentina venciÃ³ a Francia en una final legendaria por penales.",
        options: [
          { text: "Francia" },
          { text: "Brasil" },
          { text: "Argentina", isCorrect: true },
          { text: "EspaÃ±a" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El Mundial de 2026 se jugarÃ¡ en Estados Unidos, MÃ©xico y CanadÃ¡.",
        explanation: "Es el primer Mundial organizado por tres paÃ­ses, con 48 selecciones.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CÃ³mo se llama el torneo continental mÃ¡s importante de SudamÃ©rica?",
        explanation: "La Copa AmÃ©rica es el torneo de selecciones mÃ¡s antiguo del mundo.",
        options: [
          { text: "Copa AmÃ©rica", isCorrect: true },
          { text: "Copa Libertadores" },
          { text: "Sudamericano" },
          { text: "Mundialito" },
        ],
      },
    ],
  },
  {
    title: "Estrategia y tÃ¡ctica",
    description: "Formaciones, pressing y conceptos tÃ¡cticos bÃ¡sicos.",
    emoji: "ðŸ§ ",
    color: "#0891b2",
    type: "LESSON",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "En la formaciÃ³n 4-4-2, Â¿cuÃ¡ntos delanteros hay?",
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
        prompt: "Â¿QuÃ© es el 'pressing alto'?",
        explanation: "Presionar al rival en su propio campo para recuperar el balÃ³n rÃ¡pido.",
        options: [
          { text: "Defender en tu propia Ã¡rea" },
          { text: "Presionar al rival cerca de su porterÃ­a", isCorrect: true },
          { text: "Jugar con un solo delantero" },
          { text: "Esperar el error rival sin salir" },
        ],
      },
      {
        type: "TRUE_FALSE",
        prompt: "La 'posesiÃ³n' mide el tiempo que un equipo mantiene el control del balÃ³n.",
        explanation: "La posesiÃ³n es el porcentaje del tiempo en que un equipo controla el balÃ³n.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© significa 'contraataque'?",
        explanation: "Es atacar rÃ¡pido tras recuperar el balÃ³n, aprovechando que el rival estÃ¡ descolocado.",
        options: [
          { text: "Atacar rÃ¡pido tras robar el balÃ³n", isCorrect: true },
          { text: "Defender con todos los jugadores" },
          { text: "Tocar el balÃ³n sin avanzar" },
          { text: "Un cambio de portero" },
        ],
      },
    ],
  },

  {
    title: "Quiz relÃ¡mpago",
    description: "Preguntas rÃ¡pidas para calentar tu mente.",
    emoji: "ðŸŽ¯",
    color: "#16a34a",
    type: "GAME",
    xpReward: 10,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© paÃ­s ganÃ³ la Eurocopa 2024?",
        explanation: "EspaÃ±a se coronÃ³ campeona de la Euro 2024 en BerlÃ­n.",
        options: [{ text: "EspaÃ±a", isCorrect: true }, { text: "Inglaterra" }, { text: "Francia" }, { text: "Italia" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuiÃ©n ganÃ³ el BalÃ³n de Oro 2024?",
        explanation: "Rodri HernÃ¡ndez fue galardonado tras ganar la Euro y la Premier.",
        options: [{ text: "Vinicius Jr." }, { text: "Rodri", isCorrect: true }, { text: "Bellingham" }, { text: "MbappÃ©" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© club juega en el estadio Camp Nou?",
        explanation: "El Camp Nou (ahora Spotify Camp Nou) es la casa del FC Barcelona.",
        options: [{ text: "Real Madrid" }, { text: "FC Barcelona", isCorrect: true }, { text: "AtlÃ©tico de Madrid" }, { text: "Sevilla" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© paÃ­s tiene mÃ¡s Copas del Mundo?",
        explanation: "Brasil lidera con 5 tÃ­tulos mundiales.",
        options: [{ text: "Alemania" }, { text: "Argentina" }, { text: "Brasil", isCorrect: true }, { text: "Italia" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© jugador es apodado 'La Pulga'?",
        explanation: "Lionel Messi es conocido mundialmente como 'La Pulga'.",
        options: [{ text: "Neymar" }, { text: "Lionel Messi", isCorrect: true }, { text: "Cristiano Ronaldo" }, { text: "SuÃ¡rez" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CÃ³mo se llama el trofeo que levanta el campeÃ³n de la Champions League?",
        explanation: "La 'Orejona' es el apodo del trofeo de la UEFA Champions League.",
        options: [{ text: "La Orejona", isCorrect: true }, { text: "La Copa" }, { text: "El Dorado" }, { text: "El Oso" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© selecciÃ³n ganÃ³ la Copa AmÃ©rica 2024?",
        explanation: "Argentina se consagrÃ³ bicampeona de AmÃ©rica en Miami.",
        options: [{ text: "Colombia" }, { text: "Uruguay" }, { text: "Argentina", isCorrect: true }, { text: "Brasil" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿En quÃ© paÃ­s naciÃ³ PelÃ©?",
        explanation: "PelÃ© naciÃ³ en TrÃªs CoraÃ§Ãµes, Brasil.",
        options: [{ text: "Argentina" }, { text: "Brasil", isCorrect: true }, { text: "Uruguay" }, { text: "Portugal" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© equipo inglÃ©s tiene mÃ¡s Champions League?",
        explanation: "El Liverpool es el club inglÃ©s con mÃ¡s Copas de Europa (6).",
        options: [{ text: "Manchester City" }, { text: "Chelsea" }, { text: "Liverpool", isCorrect: true }, { text: "Arsenal" }],
        timeSeconds: 8,
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© arquero argentino ganÃ³ el Mundial 2022 y fue clave en los penales?",
        explanation: "Emiliano 'Dibu' MartÃ­nez fue figura atajando en la tanda final.",
        options: [{ text: "Emiliano MartÃ­nez", isCorrect: true }, { text: "Romero" }, { text: "Musso" }, { text: "Armani" }],
        timeSeconds: 8,
      },
    ],
  },

  {
    title: "Crack test",
    description: "Afirmaciones rÃ¡pidas de verdadero o falso.",
    emoji: "âš¡",
    color: "#d97706",
    type: "GAME",
    xpReward: 10,
    questions: [
      { type: "TRUE_FALSE", prompt: "El fÃºtbol se juega con 11 jugadores por equipo.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El penalti se cobra desde 11 metros.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Messi ganÃ³ el Mundial 2022 con Argentina.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "La Champions League es un torneo de selecciones.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El Real Madrid es el club con mÃ¡s Champions de la historia.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Un cÃ³rner se cobra desde la lÃ­nea de fondo.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "PelÃ© naciÃ³ en Portugal.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "La Copa AmÃ©rica es mÃ¡s antigua que el Mundial.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El Ã¡rbitro puede expulsar directamente con tarjeta roja.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Un partido de fÃºtbol dura 120 minutos sin descuento.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "El 'hat-trick' son 3 goles en un mismo partido.", options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }], timeSeconds: 5 },
      { type: "TRUE_FALSE", prompt: "Inglaterra ganÃ³ la Eurocopa 2024.", options: [{ text: "Verdadero" }, { text: "Falso", isCorrect: true }], timeSeconds: 5 },
    ],
  },

  {
    title: "TÃ©cnica: el pase",
    description: "Perfecciona la base de todo equipo: pasar el balÃ³n.",
    emoji: "ðŸ‘Ÿ",
    color: "#16a34a",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© parte del pie se usa para un pase corto preciso?",
        explanation: "El interior del pie da mayor precisiÃ³n y control al pase corto.",
        options: [{ text: "El empeine" }, { text: "El interior del pie", isCorrect: true }, { text: "El talÃ³n" }, { text: "La punta" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© tipo de pase se usa para superar a un rival a distancia?",
        explanation: "El pase largo o en profundidad busca romper lÃ­neas y llegar lejos.",
        options: [{ text: "Pase largo o en profundidad", isCorrect: true }, { text: "Pase corto" }, { text: "Pase de tacÃ³n" }, { text: "Saque de banda" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El pase con el interior del pie es mÃ¡s preciso que el de empeine.",
        explanation: "El interior ofrece mayor superficie de contacto y control.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡l es el error mÃ¡s comÃºn al pasar?",
        explanation: "Mirar fijamente el balÃ³n impide leer el movimiento de los compaÃ±eros.",
        options: [
          { text: "Mirar al balÃ³n en lugar de a los compaÃ±eros", isCorrect: true },
          { text: "Patear demasiado fuerte" },
          { text: "Patear con el interior" },
          { text: "Tocar el balÃ³n dos veces" },
        ],
      },
    ],
  },

  {
    title: "TÃ©cnica: control y recepciÃ³n",
    description: "Domina el balÃ³n al primer toque.",
    emoji: "ðŸŽ¯",
    color: "#2563eb",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡l es la clave para un buen control de balÃ³n?",
        explanation: "La 'amortiguaciÃ³n': ceder ligeramente al recibir para que el balÃ³n no rebote.",
        options: [{ text: "Ceder y amortiguar el impacto", isCorrect: true }, { text: "Golpear fuerte el balÃ³n" }, { text: "Cerrar los ojos" }, { text: "Saltar" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El control orientado permite recibir y encarar en un solo movimiento.",
        explanation: "El control orientado deja el balÃ³n listo para el siguiente pase o disparo.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© parte del cuerpo se usa para controlar un balÃ³n que viene por alto?",
        explanation: "El pecho es ideal para amortiguar balones aÃ©reos y dejarlos cerca de los pies.",
        options: [{ text: "El pecho", isCorrect: true }, { text: "La rodilla siempre" }, { text: "La cabeza siempre" }, { text: "Las manos" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© error rompe el control del balÃ³n en movimiento?",
        explanation: "Pie de apoyo mal colocado te desequilibra y pierdes el control.",
        options: [{ text: "Pie de apoyo mal colocado", isCorrect: true }, { text: "Mirar al arco" }, { text: "Tener los brazos abiertos" }, { text: "Respirar" }],
      },
    ],
  },

  {
    title: "Entrenamiento: defensa 1 vs 1",
    description: "Aprende a defender en duelos individuales.",
    emoji: "ðŸ›¡ï¸",
    color: "#dc2626",
    type: "LESSON",
    xpReward: 15,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡l es la postura ideal al defender 1 vs 1?",
        explanation: "Cuerpo bajo, rodillas flexionadas y presiÃ³n lateral sobre el balÃ³n.",
        options: [{ text: "De pie y muy recto" }, { text: "Cuerpo bajo y lateral, presionando el balÃ³n", isCorrect: true }, { text: "De espaldas al atacante" }, { text: "Corriendo al arco" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© NO debes hacer al defender un regate?",
        explanation: "Ir a 'lancero' (entrar de frente) te hace perder el equilibrio fÃ¡cilmente.",
        options: [{ text: "Entrar de frente sin control", isCorrect: true }, { text: "Esperar el movimiento del rival" }, { text: "Presionar lateral" }, { text: "Mantener la distancia" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "El defensor debe observar el balÃ³n y la posiciÃ³n del atacante a la vez.",
        explanation: "Leer el balÃ³n y al rival permite anticipar el movimiento.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿CuÃ¡ndo es buen momento para intentar quitar el balÃ³n?",
        explanation: "Al controlar mal o cuando el rival golpea el balÃ³n mÃ¡s lejos de su pie.",
        options: [
          { text: "Cuando el rival golpea el balÃ³n fuera de su control", isCorrect: true },
          { text: "Nunca" },
          { text: "Solo al inicio del partido" },
          { text: "Cuando estÃ¡ de espaldas" },
        ],
      },
    ],
  },

  {
    title: "Quiz: goleadores histÃ³ricos",
    description: "Â¿CuÃ¡nto sabes de los artilleros del fÃºtbol?",
    emoji: "ðŸ¥…",
    color: "#9333ea",
    type: "QUIZ",
    xpReward: 25,
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuiÃ©n es el mÃ¡ximo goleador histÃ³rico de las Copas del Mundo?",
        explanation: "Miroslav Klose marcÃ³ 16 goles en mundiales, superando a Ronaldo NazÃ¡rio.",
        options: [{ text: "Miroslav Klose", isCorrect: true }, { text: "Ronaldo NazÃ¡rio" }, { text: "PelÃ©" }, { text: "Messi" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuiÃ©n ganÃ³ el BalÃ³n de Oro 2022?",
        explanation: "Karim Benzema lo ganÃ³ tras su temporada histÃ³rica con el Real Madrid.",
        options: [{ text: "Karim Benzema", isCorrect: true }, { text: "Messi" }, { text: "MbappÃ©" }, { text: "Cristiano Ronaldo" }],
      },
      {
        type: "TRUE_FALSE",
        prompt: "PelÃ© marcÃ³ mÃ¡s de 1000 goles en su carrera.",
        explanation: "PelÃ© superÃ³ la barrera de los 1000 goles, hito histÃ³rico.",
        options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuÃ© jugador es conocido como 'el FenÃ³meno'?",
        explanation: "Ronaldo NazÃ¡rio, 'R9', fue apodado 'el FenÃ³meno'.",
        options: [{ text: "Ronaldo NazÃ¡rio", isCorrect: true }, { text: "Cristiano Ronaldo" }, { text: "Romario" }, { text: "Van Nistelrooy" }],
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Â¿QuiÃ©n es el mÃ¡ximo goleador de la Champions League?",
        explanation: "Cristiano Ronaldo lidera con 140 goles en la Champions.",
        options: [{ text: "Cristiano Ronaldo", isCorrect: true }, { text: "Messi" }, { text: "Lewandowski" }, { text: "Benzema" }],
      },
    ],
  },
  {
    title: "Palabras en juego",
    description: "Ordena las letras para formar la palabra en inglÃ©s. A menor tiempo, mÃ¡s goles.",
    emoji: "ðŸ”¤",
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
      { type: "MULTIPLE_CHOICE", prompt: "CHAMPION", explanation: "CampeÃ³n", options: [] },
    ],
  },
];

const temas: { name: string; emoji: string; color: string; xpReward: number }[] = [
  { name: "Training sport", emoji: "ðŸ’ª", color: "#16a34a", xpReward: 60 },
  { name: "GastronomÃ­a sport", emoji: "ðŸ½ï¸", color: "#d97706", xpReward: 60 },
  { name: "DÃ­a de Hotel", emoji: "ðŸ¨", color: "#2563eb", xpReward: 60 },
  { name: "Descansar", emoji: "ðŸ˜´", color: "#0891b2", xpReward: 60 },
  { name: "DÃ­a de juego", emoji: "ðŸŸï¸", color: "#9333ea", xpReward: 60 },
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
    name: "Fundamentos del FÃºtbol",
    description: "Reglas, posiciones y tÃ©cnica bÃ¡sica del deporte rey.",
    emoji: "âš½",
    color: "#16a34a",
    order: 0,
  },
  {
    id: "subject-cultura",
    name: "Cultura Futbolera",
    description: "Historia, torneos y curiosidades del mundo del fÃºtbol.",
    emoji: "ðŸ†",
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
  console.log(`âœ” Usuario 1 (superadmin): ${admin.email} (${admin.role})`);

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
  console.log(`âœ” Usuario 2 (admin): ${adminSecundario.email} (${adminSecundario.role})`);

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
  console.log(`âœ” Usuario 3 (entrenador): ${entrenador.email} (${entrenador.role})`);

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
  console.log(`âœ” Usuario 4 (jugador): ${jugador.email} (${jugador.role})`);

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
    console.log(`âœ” LecciÃ³n: ${lesson.title}`);
  }

  console.log(`Seed completado: ${lessons.length} lecciones creadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
