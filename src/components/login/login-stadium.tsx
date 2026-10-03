"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const GOLD = 0xc9a24a;

function normalize(object: THREE.Object3D, desiredHeight: number): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.add(object);

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const scale = desiredHeight / (size.y || 1);
  object.scale.setScalar(scale);

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
      (error) => reject(error),
    );
  });
}

export function LoginStadium() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isLight = document.documentElement.classList.contains("light");
    const sky = isLight ? 0xd7e2ec : 0x05070a;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(sky, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(sky, 16, 46);

    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xbcd0ff, isLight ? 0x6b7280 : 0x0a0f14, isLight ? 1.4 : 1.1));

    const key = new THREE.DirectionalLight(0xfff4dc, 1.7);
    key.position.set(6, 16, 10);
    key.castShadow = false;
    scene.add(key);

    const rim = new THREE.DirectionalLight(GOLD, 1.1);
    rim.position.set(-10, 8, -8);
    scene.add(rim);

    const floodA = new THREE.PointLight(0xffffff, 40, 40);
    floodA.position.set(-8, 14, 6);
    scene.add(floodA);

    const floodB = new THREE.PointLight(0xffffff, 40, 40);
    floodB.position.set(8, 14, -6);
    scene.add(floodB);

    let stadium: THREE.Group | null = null;
    let destroyed = false;
    let raf = 0;

    loadGltf("/models/building-stadium.glb")
      .then((model) => {
        if (destroyed) return;
        stadium = normalize(model, 15);
        scene.add(stadium);
      })
      .catch((error) => {
        console.error("login-stadium: error cargando el estadio", error);
      });

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const clock = new THREE.Clock();
    const target = new THREE.Vector3(0, 0.9, 0);
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      const angle = 0.35 + Math.sin(elapsed * 0.08) * 0.16;
      const radius = 12;
      camera.position.set(Math.sin(angle) * radius, 5.2, Math.cos(angle) * radius);
      camera.lookAt(target);

      if (stadium) stadium.rotation.y = Math.sin(elapsed * 0.05) * 0.03;

      renderer.render(scene, camera);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        clock.getDelta();
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material?.dispose();
        }
      });
      renderer.dispose();
      canvas.width = 0;
    };
  }, []);

  return <canvas ref={canvasRef} className="login-gate__stadium" aria-hidden="true" />;
}
