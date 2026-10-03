"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type AvatarRole = "player" | "coach";

type StageProps = {
  /** Rol resaltado (hover o seleccionado). Con null se muestran ambos avatares en reposo. */
  activeRole: AvatarRole | null;
  className?: string;
};

const GOLD = 0xc9a24a;

/**
 * Normaliza un modelo: altura deseada, base apoyada en y=0 y centrado en x/z,
 * envuelto en un Group listo para animar.
 */
function normalize(object: THREE.Object3D, desiredHeight: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const s = desiredHeight / (size.y || 1);
  object.scale.setScalar(s);

  // Recalcular tras escalar para apoyar la base y centrar
  const scaled = new THREE.Box3().setFromObject(object);
  const center = scaled.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -scaled.min.y, -center.z);

  return wrapper;
}

function loadGltf(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err),
    );
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

    const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 16 / 10, 0.1, 100);
    camera.position.set(0, 2.4, 5.6);
    camera.lookAt(0, 1.1, -1);

    // Césped interior
    const pitch = new THREE.Mesh(
      new THREE.CircleGeometry(5, 48),
      new THREE.MeshStandardMaterial({ color: 0x14371f, roughness: 0.9 }),
    );
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    // Círculo central dorado girando
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.02, 1.12, 48),
      new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);

    // Luces cálidas de estadio nocturno
    scene.add(new THREE.AmbientLight(0x404752, 1.6));
    const key = new THREE.PointLight(GOLD, 60, 20);
    key.position.set(0, 6, 2);
    scene.add(key);
    const fill = new THREE.PointLight(0x9db4ff, 30, 22);
    fill.position.set(-4, 4, 3);
    scene.add(fill);

    let playerRig: THREE.Group | null = null;
    let coachRig: THREE.Group | null = null;
    const animState: Record<AvatarRole, { t: number }> = {
      player: { t: 0 },
      coach: { t: 0 },
    };

    let destroyed = false;
    let raf = 0;

    async function build() {
      const [stadiumModel, playerModel, coachModel] = await Promise.all([
        loadGltf("/models/building-stadium.glb"),
        loadGltf("/models/human-male.glb"),
        loadGltf("/models/human-female.glb"),
      ]);
      if (destroyed) return;

      // Estadio de polycity como fondo: centrado en el origen, la cámara queda
      // dentro y enfoca el centro de la cancha.
      const stadium = normalize(stadiumModel, 14);
      stadium.position.set(0, -0.05, -3);
      scene.add(stadium);

      // Avatares de blink: masculino (jugador) y femenino (entrenador)
      playerRig = normalize(playerModel, 1.7);
      coachRig = normalize(coachModel, 1.7);
      playerRig.position.set(-1.05, 0, 0.4);
      coachRig.position.set(1.05, 0, 0.4);
      playerRig.scale.setScalar(0.001);
      coachRig.scale.setScalar(0.001);
      scene.add(playerRig);
      scene.add(coachRig);
    }

    build().catch((err) => {
      console.error("avatar-stage: error cargando modelos", err);
    });

    const resize = () => {
      const w = cvs.clientWidth || 320;
      const h = cvs.clientHeight || 200;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(cvs);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      if (destroyed) return;
      raf = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      ring.rotation.z = elapsed * 0.7;

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
        const x = rig.position.x + (targetX - rig.position.x) * Math.min(1, dt * 8);

        // Idle: respiración + giro suave
        const bob = Math.sin(elapsed * 2.2) * 0.03;
        const spin =
          target === null
            ? Math.sin(elapsed * 1.1) * 0.25
            : isSelected
              ? Math.sin(elapsed * 0.9) * 0.35
              : 0;

        rig.scale.setScalar(s);
        rig.position.set(x, bob, 0.4);
        rig.rotation.y = spin;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose?.();
      });
      renderer.dispose();
      cvs.width = 0;
    };
  }, []);

  return (
    <div className={`avatar-stage ${className ?? ""}`} aria-hidden="true">
      <canvas ref={canvasRef} className="avatar-stage__canvas" />
    </div>
  );
}
