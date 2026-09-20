"use client";

import { useEffect, useRef } from "react";
import * as pc from "playcanvas";

export type AvatarRole = "player" | "coach";

type StageProps = {
  /** Rol resaltado (hover o seleccionado). Con null se muestran ambos avatares en reposo. */
  activeRole: AvatarRole | null;
  className?: string;
};

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return new pc.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function mat(hex: string, opts: { emissive?: number } = {}) {
  const material = new pc.StandardMaterial();
  material.diffuse = color(hex);
  material.shininess = 40;
  if (opts.emissive) {
    material.emissive = color(hex).mulScalar(opts.emissive);
  }
  material.update();
  return material;
}

/** AABB mundo de todas las mesh instances de un modelo instanciado. */
function worldAabb(model: pc.Entity): pc.BoundingBox {
  const box = new pc.BoundingBox(new pc.Vec3(), new pc.Vec3(0.5, 0.5, 0.5));
  let first = true;
  for (const meshInstance of model.render?.meshInstances ?? []) {
    if (first) {
      box.copy(meshInstance.aabb);
      first = false;
    } else {
      box.add(meshInstance.aabb);
    }
  }
  return box;
}

/**
 * Normaliza un modelo instanciado: altura deseada, base apoyada en y=0 y
 * centrado en x/z. Devuelve el nodo envuelto listo para animar.
 */
function normalize(model: pc.Entity, desiredHeight: number): pc.Entity {
  const wrapper = new pc.Entity();
  wrapper.addChild(model);

  const aabb = worldAabb(model);
  const height = aabb.halfExtents.y * 2 || 1;
  const s = desiredHeight / height;
  model.setLocalScale(s, s, s);

  // Recalcular tras escalar para apoyar la base y centrar
  const scaled = worldAabb(model);
  const center = scaled.center;
  model.setLocalPosition(
    -center.x / s,
    -(center.y - scaled.halfExtents.y) / s,
    -center.z / s,
  );

  return wrapper;
}

function loadContainer(app: pc.AppBase, name: string, url: string) {
  return new Promise<pc.Entity>((resolve, reject) => {
    const asset = new pc.Asset(name, "container", { url });
    app.assets.add(asset);
    asset.on("load", () => {
      const resource = asset.resource as { instantiate: () => pc.Entity };
      resolve(resource.instantiate());
    });
    asset.on("error", (err: string) => reject(new Error(err)));
    app.assets.load(asset);
  });
}

export function AvatarStage({ activeRole, className }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<AvatarRole | null>(activeRole);
  targetRef.current = activeRole;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cvs: HTMLCanvasElement = canvas;

    const app = new pc.AppBase(canvas);
    app.init(new pc.AppOptions());
    app.start();

    let cameraComponent: pc.CameraComponent | null = null;
    let playerRig: pc.Entity | null = null;
    let coachRig: pc.Entity | null = null;
    let ring: pc.Entity | null = null;
    let destroyed = false;
    let elapsed = 0;
    const animState: Record<AvatarRole, { t: number }> = {
      player: { t: 0 },
      coach: { t: 0 },
    };

    const cleanup = () => {
      destroyed = true;
      app.destroy();
      canvas.width = 0;
    };

    async function build() {
      const [stadiumModel, playerModel, coachModel] = await Promise.all([
        loadContainer(app, "building-stadium", "/models/building-stadium.glb"),
        loadContainer(app, "human-male", "/models/human-male.glb"),
        loadContainer(app, "human-female", "/models/human-female.glb"),
      ]);
      if (destroyed) return;

      // Estadio de polycity como fondo: centrado en el origen, la cámara queda
      // dentro y enfoca el centro de la cancha.
      const stadium = normalize(stadiumModel, 14);
      stadium.setPosition(0, -0.05, -3);
      app.root.addChild(stadium);

      // Césped interior
      const pitch = new pc.Entity("pitch");
      pitch.addComponent("render", { type: "plane", material: mat("#14371f") });
      pitch.setLocalScale(9, 1, 7);
      app.root.addChild(pitch);

      // Círculo central dorado
      ring = new pc.Entity("ring");
      ring.addComponent("render", { type: "cylinder", material: mat("#c9a24a", { emissive: 0.7 }) });
      ring.setLocalScale(2.2, 0.02, 2.2);
      ring.setPosition(0, 0.02, 0);
      app.root.addChild(ring);

      // Avatares de blink: masculino (jugador) y femenino (entrenador)
      playerRig = normalize(playerModel, 1.7);
      coachRig = normalize(coachModel, 1.7);
      playerRig.setPosition(-1.05, 0, 0.4);
      coachRig.setPosition(1.05, 0, 0.4);
      playerRig.setLocalScale(0.001, 0.001, 0.001);
      coachRig.setLocalScale(0.001, 0.001, 0.001);
      app.root.addChild(playerRig);
      app.root.addChild(coachRig);

      // Luces cálidas de estadio nocturno
      const key = new pc.Entity();
      key.addComponent("light", { type: "omni", color: color("#c9a24a"), intensity: 2, range: 18 });
      key.setPosition(0, 6, 2);
      app.root.addChild(key);

      const fill = new pc.Entity();
      fill.addComponent("light", { type: "omni", color: color("#9db4ff"), intensity: 0.9, range: 20 });
      fill.setPosition(-4, 4, 3);
      app.root.addChild(fill);

      const ambient = new pc.Entity();
      ambient.addComponent("light", { type: "ambient", color: color("#404752") });
      app.root.addChild(ambient);

      // Cámara: dentro del estadio, enfocando el centro de la cancha
      const camera = new pc.Entity();
      camera.addComponent("camera", {
        clearColor: new pc.Color(0.03, 0.04, 0.05, 1),
        fov: 46,
      });
      cameraComponent = camera.camera!;
      camera.setPosition(0, 2.4, 5.6);
      camera.lookAt(0, 1.1, -1);
      app.root.addChild(camera);

      const resize = () => {
        if (!cameraComponent) return;
        const w = cvs.clientWidth || 320;
        const h = cvs.clientHeight || 200;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cvs.width = Math.floor(w * dpr);
        cvs.height = Math.floor(h * dpr);
        app.graphicsDevice.resizeCanvas(w, h);
        cameraComponent.aspectRatio = w / h;
      };
      const observer = new ResizeObserver(resize);
      observer.observe(cvs);
      resize();
    }

    build().catch((err) => {
      console.error("avatar-stage: error cargando modelos", err);
    });

    app.on("update", (dt: number) => {
      elapsed += dt;
      if (ring) ring.setEulerAngles(0, elapsed * 40, 0);

      const target = targetRef.current;
      for (const role of ["player", "coach"] as AvatarRole[]) {
        const rig = role === "player" ? playerRig : coachRig;
        if (!rig) continue;
        const baseX = role === "player" ? -1.05 : 1.05;
        const state = animState[role];
        const isSelected = target === role;

        // Pop-in al aparecer; crece el elegido, se encoge el otro
        state.t = Math.min(1, state.t + dt * 3.2);
        const eased = 1 - Math.pow(1 - state.t, 3);
        const baseScale = target === null ? 0.95 : isSelected ? 1.12 : 0.45;
        const s = Math.max(0.001, eased * baseScale);

        // El elegido pasa al centro del círculo
        const targetX = target === null ? baseX : isSelected ? 0 : baseX * 1.3;
        const currentX = rig.getPosition().x;
        const x = currentX + (targetX - currentX) * Math.min(1, dt * 8);

        // Idle: respiración + giro suave
        const bob = Math.sin(elapsed * 2.2) * 0.03;
        const spin =
          target === null
            ? Math.sin(elapsed * 1.1) * 0.25
            : isSelected
              ? Math.sin(elapsed * 0.9) * 0.35
              : 0;

        rig.setLocalScale(s, s, s);
        rig.setPosition(x, bob, 0.4);
        rig.setEulerAngles(0, spin, 0);
      }
    });

    return cleanup;
  }, []);

  return (
    <div className={`avatar-stage ${className ?? ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="avatar-stage__canvas" />
    </div>
  );
}
