"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { PlayerHomeSceneDefinition } from "@/lib/player/scene-home";

export function PlayerHomeScene({ initialScene, fixed = false }: { initialScene: PlayerHomeSceneDefinition; fixed?: boolean }) {
  const [ready, setReady] = useState(fixed);

  const sceneStyle = {
    "--player-home-scene-desktop-position": "58% 50%",
    "--player-home-scene-tablet-position": "60% 50%",
    "--player-home-scene-mobile-position": "68% 42%",
  } as CSSProperties;

  return (
    <div
      className="player-home__scene"
      data-scene-ready={ready}
      aria-hidden="true"
      style={sceneStyle}
    >
      <picture className="player-home__scene-picture player-home__scene-picture--day">
        <source media="(max-width: 47.9375rem)" srcSet="/img/back/backstadmobday.jpg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="player-home__scene-image" src="/img/back/backstadday.jpg" alt="" />
      </picture>
      <picture className="player-home__scene-picture player-home__scene-picture--night">
        <source media="(max-width: 47.9375rem)" srcSet="/img/back/backstadmob.jpg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="player-home__scene-image" src="/img/back/backstad.webp" alt="" />
      </picture>
      <span className="player-home__scene-grade" />
      <span className="player-home__scene-light" />
      <span className="player-home__scene-depth" />
    </div>
  );
}