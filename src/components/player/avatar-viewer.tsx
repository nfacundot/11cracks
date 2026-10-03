"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LowpolyHuman } from "@/lib/avatar3d/lowpoly-human";
import type { AvatarConfig } from "@/lib/avatar";

/**
 * Visor 3D del avatar: gira lentamente por sí solo y se puede girar
 * arrastrando con el puntero.
 */
export function AvatarViewer({ config, className }: { config: AvatarConfig; className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<LowpolyHuman | null>(null);
  const configRef = useRef(config);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const spinRef = useRef(-0.35);

  useEffect(() => {
    configRef.current = config;
    humanRef.current?.setConfig(config);
  }, [config]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.15, 3.4);
    camera.lookAt(0, 1.0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f3a, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(2.4, 4.2, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9a24a, 0.9);
    rim.position.set(-3, 2.4, -2.4);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const human = new LowpolyHuman({ config: configRef.current, height: 2 });
    humanRef.current = human;
    pivot.add(human.object3D);

    const resize = () => {
      const w = stage.clientWidth || 320;
      const h = stage.clientHeight || 320;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    const onDown = (event: PointerEvent) => {
      draggingRef.current = true;
      lastXRef.current = event.clientX;
      stage.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      spinRef.current += (event.clientX - lastXRef.current) * 0.012;
      lastXRef.current = event.clientX;
    };
    const onUp = (event: PointerEvent) => {
      draggingRef.current = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (!draggingRef.current) spinRef.current += delta * 0.35;
      pivot.rotation.y = spinRef.current;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      human.dispose();
      humanRef.current = null;
      renderer.dispose();
      canvas.width = 0;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={`relative cursor-grab touch-none overflow-hidden active:cursor-grabbing ${className ?? ""}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
