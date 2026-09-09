export interface PlayerHomeSceneDefinition {
  id: string;
  src: string;
  alt: string;
  desktopPosition: string;
  tabletPosition: string;
  mobilePosition: string;
  subjectSide: "left" | "center" | "right";
  overlayStrength: "soft" | "medium";
}

/**
 * Home-only scene pool, ported from edtech11. Masters are photography-only and
 * keep the left side quiet so the HTML interface can breathe beside the
 * footballer. Positions are authored per master rather than shared globally.
 */
export const playerHomeScenes: readonly PlayerHomeSceneDefinition[] = [
  {
    id: "jugador01",
    src: "/scenes/player/candidates/jugador01.jpg",
    alt: "Futbolista avanzando bajo las luces del estadio",
    desktopPosition: "77% 48%",
    tabletPosition: "78% 45%",
    mobilePosition: "62% 39%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador02",
    src: "/scenes/player/candidates/jugador02.jpg",
    alt: "Futbolista controlando el balón en un estadio lleno",
    desktopPosition: "76% 48%",
    tabletPosition: "77% 46%",
    mobilePosition: "63% 40%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador03",
    src: "/scenes/player/candidates/jugador03.jpg",
    alt: "Futbolista en acción con el balón en una cancha iluminada",
    desktopPosition: "76% 51%",
    tabletPosition: "68% 48%",
    mobilePosition: "74% 43%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador04",
    src: "/scenes/player/candidates/jugador04.jpg",
    alt: "Futbolista de pie frente a la afición del estadio",
    desktopPosition: "100% 48%",
    tabletPosition: "88% 45%",
    mobilePosition: "70% 40%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador05",
    src: "/scenes/player/candidates/jugador05.jpg",
    alt: "Futbolista preparado para jugar junto al balón",
    desktopPosition: "77% 50%",
    tabletPosition: "78% 47%",
    mobilePosition: "68% 42%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador07",
    src: "/scenes/player/candidates/jugador07.jpg",
    alt: "Futbolista celebrando en un estadio iluminado",
    desktopPosition: "78% 45%",
    tabletPosition: "79% 42%",
    mobilePosition: "70% 37%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "jugador08",
    src: "/scenes/player/candidates/jugador08.jpg",
    alt: "Futbolista caminando por la cancha bajo la lluvia",
    desktopPosition: "77% 45%",
    tabletPosition: "78% 42%",
    mobilePosition: "68% 38%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "player-duvan-negative-space",
    src: "/scenes/player/candidates/newDuvan Vergara.png",
    alt: "Futbolista corriendo en un estadio nocturno",
    desktopPosition: "72% 50%",
    tabletPosition: "70% 50%",
    mobilePosition: "90% 50%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "player-sebastian-negative-space",
    src: "/scenes/player/candidates/-sebastian-villa-.png",
    alt: "Futbolista de pie en un estadio iluminado",
    desktopPosition: "78% 50%",
    tabletPosition: "76% 50%",
    mobilePosition: "91% 50%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "player-threshold",
    src: "/scenes/player/candidates/player-threshold-stadium-candidate-01.png",
    alt: "Jugador entrando desde un túnel hacia un campo iluminado",
    desktopPosition: "72% 50%",
    tabletPosition: "74% 50%",
    mobilePosition: "91% 50%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
  {
    id: "player-touchline",
    src: "/scenes/player/candidates/player-touchline-horizon-candidate-02.png",
    alt: "Jugadora junto al campo bajo la luz del estadio",
    desktopPosition: "79% 50%",
    tabletPosition: "80% 50%",
    mobilePosition: "92% 50%",
    subjectSide: "right",
    overlayStrength: "soft",
  },
];

export function getRandomPlayerHomeScene(): PlayerHomeSceneDefinition {
  return playerHomeScenes[Math.floor(Math.random() * playerHomeScenes.length)] ?? playerHomeScenes[0];
}

export function getPlayerHomeScene(id: string): PlayerHomeSceneDefinition {
  return playerHomeScenes.find((scene) => scene.id === id) ?? playerHomeScenes[0];
}