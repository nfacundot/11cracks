"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { selectLoginScene, type LoginSceneDefinition } from "@/lib/login/scenes";

type LoginSceneStyle = CSSProperties & Record<`--login-focal-${string}`, string>;

const LAST_SCENE_KEY = "11cracks:login:last-scene";

function sceneStyle(scene: LoginSceneDefinition): LoginSceneStyle {
  return {
    "--login-focal-mobile": scene.mobilePosition,
    "--login-focal-tablet": scene.tabletPosition,
    "--login-focal-desktop": scene.desktopPosition,
    "--login-focal-wide": scene.widePosition,
  };
}

export function LoginScene({
  initialScene,
  pool,
}: {
  initialScene: LoginSceneDefinition;
  pool: readonly LoginSceneDefinition[];
}) {
  const [scene, setScene] = useState(initialScene);

  useEffect(() => {
    const lastScene = window.sessionStorage.getItem(LAST_SCENE_KEY);
    const nextScene = lastScene === initialScene.id ? selectLoginScene(initialScene.id, pool) : initialScene;
    window.sessionStorage.setItem(LAST_SCENE_KEY, nextScene.id);
    if (nextScene.id === initialScene.id) return;
    const frame = window.requestAnimationFrame(() => setScene(nextScene));
    return () => window.cancelAnimationFrame(frame);
  }, [initialScene, pool]);

  return (
    <div
      className="login-scene"
      style={sceneStyle(scene)}
      data-scene-id={scene.id}
      data-subject-side={scene.subjectSide}
      data-ui-side={scene.uiSide}
      aria-hidden="true"
    >
      <Image key={scene.id} className="login-scene__image" src={scene.src} alt="" fill priority sizes="100vw" unoptimized />
      <div className="login-scene__grade" />
      <div className="login-scene__haze" />
      <div className="login-atmosphere" aria-hidden="true">
        <span className="login-particle login-particle--one" />
        <span className="login-particle login-particle--two" />
        <span className="login-particle login-particle--three" />
        <span className="login-particle login-particle--four" />
        <span className="login-particle login-particle--five" />
        <span className="login-particle login-particle--six" />
        <span className="login-particle login-particle--seven" />
      </div>
    </div>
  );
}
