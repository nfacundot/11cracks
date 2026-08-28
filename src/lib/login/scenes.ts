export interface LoginSceneDefinition {
  id: string;
  src: string;
  alt: string;
  desktopPosition: string;
  tabletPosition: string;
  mobilePosition: string;
  widePosition: string;
  subjectSide: "left" | "center" | "right";
  uiSide: "left" | "right";
}

export const loginFallbackScene: LoginSceneDefinition = {
  id: "stadium-tunnel-fallback",
  src: "/images/login/login-stadium.png",
  alt: "Futbolista entrando desde el túnel hacia un estadio iluminado",
  desktopPosition: "68% center",
  tabletPosition: "64% center",
  mobilePosition: "70% center",
  widePosition: "66% center",
  subjectSide: "right",
  uiSide: "left",
};

export const loginScenePool: readonly LoginSceneDefinition[] = [
  {
    id: "player-duvan-negative-space",
    src: "/scenes/player/candidates/newDuvan Vergara.png",
    alt: "Futbolista corriendo en un estadio nocturno",
    desktopPosition: "72% center",
    tabletPosition: "70% center",
    mobilePosition: "90% center",
    widePosition: "72% center",
    subjectSide: "right",
    uiSide: "left",
  },
  {
    id: "player-sebastian-negative-space",
    src: "/scenes/player/candidates/-sebastian-villa-.png",
    alt: "Futbolista de pie en un estadio iluminado",
    desktopPosition: "78% center",
    tabletPosition: "76% center",
    mobilePosition: "91% center",
    widePosition: "78% center",
    subjectSide: "right",
    uiSide: "left",
  },
  {
    id: "player-threshold",
    src: "/scenes/player/candidates/player-threshold-stadium-candidate-01.png",
    alt: "Jugador entrando desde un túnel hacia un campo iluminado",
    desktopPosition: "72% center",
    tabletPosition: "74% center",
    mobilePosition: "91% center",
    widePosition: "72% center",
    subjectSide: "right",
    uiSide: "left",
  },
  {
    id: "player-touchline",
    src: "/scenes/player/candidates/player-touchline-horizon-candidate-02.png",
    alt: "Jugadora junto al campo bajo la luz del estadio",
    desktopPosition: "79% center",
    tabletPosition: "80% center",
    mobilePosition: "92% center",
    widePosition: "79% center",
    subjectSide: "right",
    uiSide: "left",
  },
];

export function selectLoginScene(excludeId?: string, source: readonly LoginSceneDefinition[] = loginScenePool): LoginSceneDefinition {
  const candidates = source.filter((scene) => scene.id !== excludeId);
  const pool = candidates.length > 0 ? candidates : source;
  return pool[Math.floor(Math.random() * pool.length)] ?? loginFallbackScene;
}
