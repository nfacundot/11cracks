import type {
  BilingualGameConfig,
  BilingualGameId,
  LetterObjective,
  ListeningObjective,
  MeaningObjective,
  TargetLanguage,
  VisualOption,
} from "./game-contracts";

const speech = (text: string, targetLanguage: TargetLanguage = "en") => ({ kind: "speech", text, targetLanguage, language: targetLanguage === "pt" ? "pt-BR" : "en-US" }) as const;

const lockerOptions = [
  {
    id: "jersey",
    label: "Camiseta",
    asset: { src: "/game-assets/bilinguisimo/oido/jersey-phase03b-v1.png", alt: "Camiseta de fútbol", width: 1254, height: 1254 },
  },
  {
    id: "shorts",
    label: "Pantaloneta",
    asset: { src: "/game-assets/bilinguisimo/oido/shorts-phase03b-v1.png", alt: "Pantaloneta de fútbol", width: 1254, height: 1254 },
  },
  {
    id: "boots",
    label: "Botines",
    asset: { src: "/game-assets/bilinguisimo/oido/football-boots-phase03b-v1.png", alt: "Botines de fútbol", width: 1254, height: 1254 },
  },
  {
    id: "socks",
    label: "Medias largas",
    asset: { src: "/game-assets/bilinguisimo/oido/long-socks-phase03b-v1.png", alt: "Medias largas de fútbol", width: 1254, height: 1254 },
  },
] as const satisfies readonly VisualOption[];

const oidoObjectives = [
  {
    id: "locker-jersey",
    targetLanguage: "en",
    mechanic: "visual-choice",
    target: "JERSEY",
    audio: speech("jersey"),
    options: lockerOptions,
    correctAnswerId: "jersey",
    feedback: { correct: "¡Bien visto! Jersey es camiseta.", incorrect: "Escucha otra vez: jersey es la camiseta del equipo." },
  },
  {
    id: "locker-shorts",
    targetLanguage: "en",
    mechanic: "visual-choice",
    target: "SHORTS",
    audio: speech("shorts"),
    options: lockerOptions,
    correctAnswerId: "shorts",
    feedback: { correct: "¡Correcto! Shorts es pantaloneta.", incorrect: "La pista está en la ropa de juego: shorts es pantaloneta." },
  },
  {
    id: "locker-football-boots",
    targetLanguage: "en",
    mechanic: "visual-choice",
    target: "FOOTBALL BOOTS",
    audio: speech("football boots"),
    options: lockerOptions,
    correctAnswerId: "boots",
    feedback: { correct: "¡Eso es! Football boots son los botines.", incorrect: "Escucha la palabra completa: football boots son los botines." },
  },
  {
    id: "locker-long-socks",
    targetLanguage: "en",
    mechanic: "visual-choice",
    target: "LONG SOCKS",
    audio: speech("long socks"),
    options: lockerOptions,
    correctAnswerId: "socks",
    feedback: { correct: "¡Objetivo cumplido! Long socks son medias largas.", incorrect: "Fíjate en lo que cubre la pierna: long socks son medias largas." },
  },
] as const satisfies readonly ListeningObjective[];

const meaningOptions = [
  { id: "forward", label: "Delantero" },
  { id: "midfielder", label: "Mediocampista" },
  { id: "defender", label: "Defensa" },
  { id: "winger", label: "Extremo" },
] as const;

const golObjectives = [
  {
    id: "position-forward",
    targetLanguage: "en",
    mechanic: "meaning-choice",
    target: "FORWARD",
    audio: speech("forward"),
    options: meaningOptions,
    correctAnswerId: "forward",
    feedback: { correct: "¡Gol! Forward significa delantero.", incorrect: "El remate se fue. Forward significa delantero." },
  },
  {
    id: "position-midfielder",
    targetLanguage: "en",
    mechanic: "meaning-choice",
    target: "MIDFIELDER",
    audio: speech("midfielder"),
    options: meaningOptions,
    correctAnswerId: "midfielder",
    feedback: { correct: "¡Gol! Midfielder significa mediocampista.", incorrect: "Cerca del poste. Midfielder significa mediocampista." },
  },
  {
    id: "position-defender",
    targetLanguage: "en",
    mechanic: "meaning-choice",
    target: "DEFENDER",
    audio: speech("defender"),
    options: meaningOptions,
    correctAnswerId: "defender",
    feedback: { correct: "¡Gol! Defender significa defensa.", incorrect: "Inténtalo de nuevo: defender significa defensa." },
  },
  {
    id: "position-winger",
    targetLanguage: "en",
    mechanic: "meaning-choice",
    target: "WINGER",
    audio: speech("winger"),
    options: meaningOptions,
    correctAnswerId: "winger",
    feedback: { correct: "¡Golazo! Winger significa extremo.", incorrect: "El balón salió ancho. Winger significa extremo." },
  },
] as const satisfies readonly MeaningObjective[];

const letrasObjectives = [
  {
    id: "food-rice",
    targetLanguage: "en",
    mechanic: "letter-build",
    target: "RICE",
    audio: speech("rice"),
    prompt: "Escucha. Mira. Construye.",
    meaning: "Arroz",
    visualAsset: { src: "/game-assets/bilinguisimo/letras/rice-v1.png", alt: "Bowl de arroz cocido", width: 627, height: 627 },
    availableLetters: ["E", "A", "R", "I", "C", "O"],
    correctOrder: "RICE",
    feedback: { correct: "¡Palabra completa! Rice significa arroz.", incorrect: "Revisa el orden: rice se forma R-I-C-E." },
  },
  {
    id: "food-eggs",
    targetLanguage: "en",
    mechanic: "letter-build",
    target: "EGGS",
    audio: speech("eggs"),
    prompt: "Escucha. Mira. Construye.",
    meaning: "Huevos",
    visualAsset: { src: "/game-assets/bilinguisimo/letras/eggs-v1.png", alt: "Huevos cocidos", width: 627, height: 627 },
    availableLetters: ["S", "E", "A", "G", "G", "O"],
    correctOrder: "EGGS",
    feedback: { correct: "¡Bien construido! Eggs significa huevos.", incorrect: "Escucha la doble consonante: eggs se forma E-G-G-S." },
  },
  {
    id: "food-salad",
    targetLanguage: "en",
    mechanic: "letter-build",
    target: "SALAD",
    audio: speech("salad"),
    prompt: "Escucha. Mira. Construye.",
    meaning: "Ensalada",
    visualAsset: { src: "/game-assets/bilinguisimo/letras/salad-v1.png", alt: "Bowl de ensalada fresca", width: 627, height: 627 },
    availableLetters: ["L", "S", "A", "O", "D", "A", "E"],
    correctOrder: "SALAD",
    feedback: { correct: "¡Perfecto! Salad significa ensalada.", incorrect: "Ordena con calma: salad se forma S-A-L-A-D." },
  },
  {
    id: "food-soda",
    targetLanguage: "en",
    mechanic: "letter-build",
    target: "SODA",
    audio: speech("soda"),
    prompt: "Escucha. Mira. Construye.",
    meaning: "Gaseosa",
    visualAsset: { src: "/game-assets/bilinguisimo/letras/soda-v1.png", alt: "Botella de gaseosa con gas", width: 627, height: 627 },
    availableLetters: ["D", "A", "S", "E", "O", "I"],
    correctOrder: "SODA",
    feedback: { correct: "¡Objetivo cumplido! Soda significa gaseosa.", incorrect: "Prueba este orden: soda se forma S-O-D-A." },
  },
] as const satisfies readonly LetterObjective[];

/**
 * Phase 03B demo fixture sourced from the approved Bilingüismo Sport system document.
 * Recorded voice assets can replace the speech references without changing game UI or engine code.
 */
export const bilingualGames = [
  {
    id: "oido-de-crack",
    label: "Oído de Crack",
    shortLabel: "Escucha y reconoce",
    description: "Reconoce lo que escuchas dentro y fuera de la cancha.",
    mechanicLine: "Escucha. Mira. Elige.",
    support: "Puedes escuchar el audio otra vez.",
    accent: "cyan",
    session: {
      id: "oido-vestuario-01",
      gameId: "oido-de-crack",
      environmentId: "vestuario",
      environmentLabel: "Vestuario",
      title: "La equipación",
      targetLanguage: "en",
      scene: {
        src: "/scenes/bilinguisimo/vestuario-demo-v1.png",
        alt: "Vestuario de fútbol preparado antes del partido",
        focalPoint: "62% center",
        crops: { desktop: "62% center", tablet: "66% center", mobile: "73% center" },
        safeInteractionArea: "center-stage",
        protectedVisualArea: "right-tunnel",
      },
      objectives: oidoObjectives,
    },
  },
  {
    id: "gol-de-palabra",
    label: "Gol de Palabra",
    shortLabel: "Escucha y entiende",
    description: "Elige el significado correcto y manda el balón al arco.",
    mechanicLine: "Escucha. Entiende. Define.",
    support: "Cada significado correcto termina en gol.",
    accent: "lime",
    session: {
      id: "gol-posiciones-01",
      gameId: "gol-de-palabra",
      environmentId: "entrenamiento",
      environmentLabel: "Entrenamiento",
      title: "Posiciones en cancha",
      targetLanguage: "en",
      scene: {
        src: "/scenes/bilinguisimo/gol-de-palabra-frontal-desktop-v1.png",
        mobileSrc: "/scenes/bilinguisimo/gol-de-palabra-frontal-mobile-v1.png",
        alt: "Campo de entrenamiento nocturno visto de frente hacia un arco con maniquíes",
        focalPoint: "50% center",
        crops: { desktop: "50% center", tablet: "50% center", mobile: "50% center" },
        safeInteractionArea: "center-stage",
        protectedVisualArea: "center-goal",
      },
      objectives: golObjectives,
    },
  },
  {
    id: "letras-de-crack",
    label: "Letras de Crack",
    shortLabel: "Escucha y construye",
    description: "Forma correctamente la palabra que escuchas.",
    mechanicLine: "Escucha. Ordena. Construye.",
    support: "Toca una letra para colocarla y tócala otra vez para corregir.",
    accent: "violet",
    session: {
      id: "letras-gastronomia-01",
      gameId: "letras-de-crack",
      environmentId: "gastronomia",
      environmentLabel: "Gastronomía",
      title: "Energía para competir",
      scene: { src: "/scenes/bilinguisimo/gastronomia-demo-v1.png", alt: "Estación de alimentación deportiva en un centro de entrenamiento", focalPoint: "50% center" },
      targetLanguage: "en",
      objectives: letrasObjectives,
    },
  },
] as const satisfies readonly BilingualGameConfig[];

const portugueseOidoObjectives = [
  { id: "locker-jersey", targetLanguage: "pt", mechanic: "visual-choice", target: "CAMISA", audio: speech("camisa", "pt"), options: lockerOptions, correctAnswerId: "jersey", feedback: { correct: "Muito bem! Camisa é a peça do time.", incorrect: "Escute de novo: camisa é a peça do time." } },
  { id: "locker-shorts", targetLanguage: "pt", mechanic: "visual-choice", target: "CALÇÃO", audio: speech("calção", "pt"), options: lockerOptions, correctAnswerId: "shorts", feedback: { correct: "Correto! Calção faz parte do uniforme.", incorrect: "Pense na roupa de jogo: calção é a parte de baixo." } },
  { id: "locker-football-boots", targetLanguage: "pt", mechanic: "visual-choice", target: "CHUTEIRAS", audio: speech("chuteiras", "pt"), options: lockerOptions, correctAnswerId: "boots", feedback: { correct: "Isso! Chuteiras são usadas para jogar.", incorrect: "Escute a palavra completa: chuteiras são os sapatos de futebol." } },
  { id: "locker-long-socks", targetLanguage: "pt", mechanic: "visual-choice", target: "MEIAS LONGAS", audio: speech("meias longas", "pt"), options: lockerOptions, correctAnswerId: "socks", feedback: { correct: "Objetivo cumprido! Meias longas protegem as pernas.", incorrect: "Observe o que cobre a perna: meias longas." } },
] as const satisfies readonly ListeningObjective[];

const portugueseGolObjectives = [
  { id: "position-forward", targetLanguage: "pt", mechanic: "meaning-choice", target: "ATACANTE", audio: speech("atacante", "pt"), options: [{ id: "forward", label: "Atacante" }, { id: "midfielder", label: "Meio-campista" }, { id: "defender", label: "Defensor" }, { id: "winger", label: "Ponta" }], correctAnswerId: "forward", feedback: { correct: "Gol! Atacante joga no ataque.", incorrect: "O chute parou. Atacante é quem joga no ataque." } },
  { id: "position-midfielder", targetLanguage: "pt", mechanic: "meaning-choice", target: "MEIO-CAMPISTA", audio: speech("meio-campista", "pt"), options: [{ id: "forward", label: "Atacante" }, { id: "midfielder", label: "Meio-campista" }, { id: "defender", label: "Defensor" }, { id: "winger", label: "Ponta" }], correctAnswerId: "midfielder", feedback: { correct: "Gol! Meio-campista joga no meio.", incorrect: "Quase. Meio-campista joga no meio do campo." } },
  { id: "position-defender", targetLanguage: "pt", mechanic: "meaning-choice", target: "DEFENSOR", audio: speech("defensor", "pt"), options: [{ id: "forward", label: "Atacante" }, { id: "midfielder", label: "Meio-campista" }, { id: "defender", label: "Defensor" }, { id: "winger", label: "Ponta" }], correctAnswerId: "defender", feedback: { correct: "Gol! Defensor protege a equipe.", incorrect: "Tente outra vez: defensor protege a equipe." } },
  { id: "position-winger", targetLanguage: "pt", mechanic: "meaning-choice", target: "PONTA", audio: speech("ponta", "pt"), options: [{ id: "forward", label: "Atacante" }, { id: "midfielder", label: "Meio-campista" }, { id: "defender", label: "Defensor" }, { id: "winger", label: "Ponta" }], correctAnswerId: "winger", feedback: { correct: "Que golaço! Ponta joga pelos lados.", incorrect: "A bola saiu. Ponta joga pelos lados do campo." } },
] as const satisfies readonly MeaningObjective[];

const portugueseLetrasObjectives = [
  { id: "food-rice", targetLanguage: "pt", mechanic: "letter-build", target: "ARROZ", audio: speech("arroz", "pt"), prompt: "Escute. Veja. Construa.", meaning: "Arroz", visualAsset: { src: "/game-assets/bilinguisimo/letras/rice-v1.png", alt: "Tigela de arroz cozido", width: 627, height: 627 }, availableLetters: ["O", "A", "R", "Z", "R", "I"], correctOrder: "ARROZ", feedback: { correct: "Palavra completa! Arroz é rice.", incorrect: "Revise a ordem: arroz se forma A-R-R-O-Z." } },
  { id: "food-eggs", targetLanguage: "pt", mechanic: "letter-build", target: "OVOS", audio: speech("ovos", "pt"), prompt: "Escute. Veja. Construa.", meaning: "Ovos", visualAsset: { src: "/game-assets/bilinguisimo/letras/eggs-v1.png", alt: "Ovos cozidos", width: 627, height: 627 }, availableLetters: ["S", "O", "V", "A", "O", "E"], correctOrder: "OVOS", feedback: { correct: "Muito bem! Ovos é eggs.", incorrect: "Organize com calma: ovos se forma O-V-O-S." } },
  { id: "food-salad", targetLanguage: "pt", mechanic: "letter-build", target: "SALADA", audio: speech("salada", "pt"), prompt: "Escute. Veja. Construa.", meaning: "Salada", visualAsset: { src: "/game-assets/bilinguisimo/letras/salad-v1.png", alt: "Tigela de salada fresca", width: 627, height: 627 }, availableLetters: ["L", "S", "A", "D", "A", "E", "A"], correctOrder: "SALADA", feedback: { correct: "Perfeito! Salada é salad.", incorrect: "Tente esta ordem: salada se forma S-A-L-A-D-A." } },
  { id: "food-soda", targetLanguage: "pt", mechanic: "letter-build", target: "REFRIGERANTE", audio: speech("refrigerante", "pt"), prompt: "Escute. Veja. Construa.", meaning: "Refrigerante", visualAsset: { src: "/game-assets/bilinguisimo/letras/soda-v1.png", alt: "Garrafa de refrigerante", width: 627, height: 627 }, availableLetters: ["R", "E", "F", "R", "I", "G", "E", "R", "A", "N", "T", "E"], correctOrder: "REFRIGERANTE", feedback: { correct: "Objetivo cumprido! Refrigerante é soda.", incorrect: "Escute novamente e organize refrigerante." } },
] as const satisfies readonly LetterObjective[];

const portugueseObjectives = [portugueseOidoObjectives, portugueseGolObjectives, portugueseLetrasObjectives] as const;
const portugueseGames = bilingualGames.map((game, index) => ({
  ...game,
  session: {
    ...game.session,
    id: `${game.session.id}-pt`,
    targetLanguage: "pt" as const,
    objectives: portugueseObjectives[index],
  },
})) as readonly BilingualGameConfig[];

export const bilingualGameOrder = bilingualGames.map((game) => game.id) as BilingualGameId[];

export function getBilingualGames(targetLanguage: TargetLanguage = "en"): readonly BilingualGameConfig[] {
  return targetLanguage === "pt" ? portugueseGames : bilingualGames;
}

export function getBilingualGame(gameId: string, targetLanguage: TargetLanguage = "en"): BilingualGameConfig | undefined {
  return getBilingualGames(targetLanguage).find((game) => game.id === gameId);
}

export function getNextBilingualGame(gameId: BilingualGameId, targetLanguage: TargetLanguage = "en") {
  const index = bilingualGameOrder.indexOf(gameId);
  const nextId = bilingualGameOrder[index + 1];
  return nextId ? getBilingualGame(nextId, targetLanguage) : undefined;
}
