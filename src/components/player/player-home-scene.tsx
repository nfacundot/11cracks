"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { playerHomeScenes as playerHomeScenePool, type PlayerHomeSceneDefinition } from "@/lib/player/scene-home";

const currentStorageKey = "11cracks.player-home.current-scene";
const lastStorageKey = "11cracks.player-home.last-scene";

function selectScene(initialScene: PlayerHomeSceneDefinition): PlayerHomeSceneDefinition {
  try {
    const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isDocumentReload = navigation?.type === "reload";
    const currentSceneId = isDocumentReload ? window.sessionStorage.getItem(currentStorageKey) : null;
    const currentScene = playerHomeScenePool.find((scene) => scene.id === currentSceneId);
    if (currentScene) return currentScene;

    const lastSceneId = window.sessionStorage.getItem(lastStorageKey);
    const alternatives = lastSceneId
      ? playerHomeScenePool.filter((scene) => scene.id !== lastSceneId)
      : playerHomeScenePool;
    const selected = alternatives[Math.floor(Math.random() * alternatives.length)] ?? initialScene;
    window.sessionStorage.setItem(currentStorageKey, selected.id);
    window.sessionStorage.setItem(lastStorageKey, selected.id);
    return selected;
  } catch {
    return initialScene;
  }
}

export function PlayerHomeScene({ initialScene, fixed = false }: { initialScene: PlayerHomeSceneDefinition; fixed?: boolean }) {
  const [scene, setScene] = useState(initialScene);
  const [ready, setReady] = useState(fixed);
  const committedRef = useRef(false);

  useEffect(() => {
    if (fixed) {
      setReady(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setScene(selectScene(initialScene));
      committedRef.current = true;
      setReady(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (committedRef.current) {
        try {
          window.sessionStorage.removeItem(currentStorageKey);
        } catch {
          // Private browsing can disable sessionStorage; scene selection still works.
        }
      }
    };
  }, [fixed, initialScene]);

  const sceneStyle = {
    "--player-home-scene-desktop-position": scene.desktopPosition,
    "--player-home-scene-tablet-position": scene.tabletPosition,
    "--player-home-scene-mobile-position": scene.mobilePosition,
  } as CSSProperties;

  return (
    <div
      className="player-home__scene"
      data-scene-id={scene.id}
      data-scene-ready={ready}
      data-subject-side={scene.subjectSide}
      data-overlay-strength={scene.overlayStrength}
      aria-hidden="true"
      style={sceneStyle}
    >
      <Image
        key={scene.id}
        className="player-home__scene-image"
        src={scene.src}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 240px), 100vw"
      />
      <span className="player-home__scene-grade" />
      <span className="player-home__scene-light" />
      <span className="player-home__scene-depth" />
    </div>
  );
}