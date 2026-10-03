"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { LowpolyHuman } from "@/lib/avatar3d/lowpoly-human";
import { DEFAULT_AVATAR_CONFIG, parseAvatarConfig, type AvatarConfig } from "@/lib/avatar";
import { PlayerContextMenu, type WorldPlayerInfo } from "./player-context-menu";

const COLYSEUS_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";
const WORLD_ROOM = "world";

type LobbyState = { avatarsJson?: string; count?: number };
type LobbyRoomClient = {
  sessionId: string;
  send: (type: string, message?: unknown) => void;
  leave: (consented?: boolean) => void;
  onStateChange: (cb: (state: LobbyState) => void) => void;
  onLeave: (cb: (code: number) => void) => void;
  onError: (cb: (code: number, message?: string) => void) => void;
};
type RemoteEntry = {
  sessionId: string;
  userId: string;
  name: string;
  username?: string;
  team: string;
  teamLogo: string;
  config: string;
  x: number;
  z: number;
  rot: number;
};
type RemotePlayer = {
  human: LowpolyHuman;
  data: WorldPlayerInfo;
  target: THREE.Vector3;
  rotTarget: number;
  phase: number;
};
export type WorldIdentity = {
  id: string;
  name: string;
  username?: string;
  teamName: string | null;
  teamLogoUrl: string | null;
};

const BLOCK = 64;
const CENTER_BLOCK = 84;
const SPACING = 100;
const WORLD_HALF = 155;
const SIDEWALK = BLOCK / 2 - 1.5;
const WALK_SPEED = 4;
const RUN_SPEED = 7;
const TURN_SPEED = 2.6;
const AVATAR_RADIUS = 0.45;
const BALL_RADIUS = 0.22;
const THIRD = { distance: 5.2, height: 2.7, look: 1.15 };
const FIRST = { height: 1.62, forward: 0.4 };
const DOOR = { z: 36, half: 8 };

const subscribe = () => () => {};

type Collider = { x: number; z: number; hw: number; hd: number };

type Interactable = {
  x: number;
  z: number;
  y: number;
  radius: number;
  key: string;
  action: () => void;
  label: () => string;
  enabled?: () => boolean;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

let hazardTexture: THREE.Texture | null = null;
function getHazardTexture() {
  if (hazardTexture) return hazardTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#f5c518";
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = "#1a1a1a";
    for (let x = -32; x < 128; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x, 32);
      ctx.lineTo(x - 16, 32);
      ctx.closePath();
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  hazardTexture = texture;
  return texture;
}

let waterTexture: THREE.Texture | null = null;
function getWaterTexture() {
  if (waterTexture) return waterTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#2f8fd0";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    for (let y = 0; y < 128; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(32, y + 6, 96, y - 6, 128, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 70; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  waterTexture = texture;
  return texture;
}

let stadiumTexture: THREE.Texture | null = null;
function getStadiumTexture() {
  if (stadiumTexture) return stadiumTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  stadiumTexture = texture;

  const base = new Image();
  base.onload = () => {
    if (!ctx) return;
    ctx.drawImage(base, 0, 0, 512, 512);
    const sign = new Image();
    sign.onload = () => {
      // Reemplaza los rótulos del atlas ("SimplePoly Stadium" y "Football Stadium")
      // por el aviso de entrada estadioentr.png
      ctx.drawImage(sign, 8, 86, 250, 124);
      ctx.drawImage(sign, 98, 6, 314, 54);
      texture.needsUpdate = true;
    };
    sign.src = "/img/emotes/estadioentr.png";
    texture.needsUpdate = true;
  };
  base.src = "/textures/Building_Stadium.png";
  return texture;
}

let ballTexture: THREE.Texture | null = null;
function getBallTexture() {
  if (ballTexture) return ballTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#141414";
    const pentagon = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };
    for (let y = 32; y < 256; y += 64) for (let x = 32; x < 256; x += 64) pentagon(x, y, 20);
    for (let y = 64; y < 256; y += 64) for (let x = 64; x < 256; x += 64) pentagon(x, y, 20);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  ballTexture = texture;
  return texture;
}

function fitToFootprint(object: THREE.Object3D, maxSize: number) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const scale = maxSize / Math.max(size.x, size.z || 1);
  object.scale.setScalar(scale);
  const scaled = new THREE.Box3().setFromObject(object);
  const center = scaled.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -scaled.min.y, -center.z);
  return object;
}

type CrowdFan = {
  group: THREE.Group;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  type: number;
  phase: number;
  baseY: number;
  baseRotY: number;
};

const CROWD_JERSEYS = [0x2563eb, 0xdc2626, 0x16a34a, 0xfacc15, 0xf8fafc, 0x111827, 0x7c3aed, 0x0ea5e9];

/** Grada animada alrededor de la cancha: saltos, celebración y apoyo. */
function buildCrowd(pitchY: number, fans: CrowdFan[], model: THREE.Object3D): THREE.Group {
  const root = new THREE.Group();
  const torsoGeo = new THREE.CapsuleGeometry(0.2, 0.42, 4, 8);
  const headGeo = new THREE.SphereGeometry(0.15, 10, 8);
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.34, 4, 6);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.85 });
  const jerseyMats = CROWD_JERSEYS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));

  // Posiciones candidatas alrededor de la cancha; se ajustan a la grada con un rayo.
  const candidates: Array<{ x: number; z: number }> = [];
  for (let row = 0; row < 4; row += 1) {
    const zOff = 31 + row * 2.5;
    const xOff = 24 + row * 2.5;
    for (let x = -22; x <= 22; x += 5) {
      candidates.push({ x, z: zOff });
      candidates.push({ x, z: -zOff });
    }
    for (let z = -29; z <= 29; z += 5) {
      candidates.push({ x: xOff, z });
      candidates.push({ x: -xOff, z });
    }
  }

  const ray = new THREE.Raycaster();
  ray.near = 0;
  ray.far = 90;
  const from = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);

  let placed = 0;
  candidates.forEach((seat) => {
    from.set(seat.x, pitchY + 40, seat.z);
    ray.set(from, down);
    const hits = ray.intersectObject(model, true);
    if (!hits.length) return;
    const y = hits[0].point.y;
    if (y < pitchY + 1.0) return; // sobre la cancha, no en la grada

    const group = new THREE.Group();
    group.position.set(seat.x, y + 0.05, seat.z);
    group.rotation.y = Math.atan2(-seat.x, -seat.z);

    const jersey = jerseyMats[placed % jerseyMats.length] ?? jerseyMats[0]!;
    const torso = new THREE.Mesh(torsoGeo, jersey);
    torso.position.y = 0.5;
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.92;
    const armL = new THREE.Mesh(armGeo, jersey);
    armL.position.set(-0.26, 0.6, 0);
    const armR = new THREE.Mesh(armGeo, jersey);
    armR.position.set(0.26, 0.6, 0);
    group.add(torso, head, armL, armR);
    root.add(group);

    fans.push({
      group,
      armL,
      armR,
      type: placed % 3,
      phase: (placed % 19) * 0.9,
      baseY: group.position.y,
      baseRotY: group.rotation.y,
    });
    placed += 1;
  });

  return root;
}

function animateCrowd(fans: CrowdFan[], t: number) {
  for (const fan of fans) {
    if (fan.type === 0) {
      // Salto
      fan.group.position.y = fan.baseY + Math.abs(Math.sin(t * 4.5 + fan.phase)) * 0.28;
      fan.armL.rotation.z = 0.25;
      fan.armR.rotation.z = -0.25;
      fan.group.rotation.y = fan.baseRotY;
      fan.group.rotation.z = 0;
    } else if (fan.type === 1) {
      // Celebración
      fan.group.position.y = fan.baseY + Math.abs(Math.sin(t * 3 + fan.phase)) * 0.14;
      fan.armL.rotation.z = 2.3 + Math.sin(t * 8 + fan.phase) * 0.2;
      fan.armR.rotation.z = -2.3 - Math.sin(t * 8 + fan.phase) * 0.2;
      fan.group.rotation.y = fan.baseRotY + Math.sin(t * 2 + fan.phase) * 0.18;
      fan.group.rotation.z = 0;
    } else {
      // Apoyo
      fan.group.position.y = fan.baseY;
      fan.armL.rotation.z = 2.5 + Math.sin(t * 5 + fan.phase) * 0.35;
      fan.armR.rotation.z = -2.5 - Math.sin(t * 5 + fan.phase) * 0.35;
      fan.group.rotation.y = fan.baseRotY;
      fan.group.rotation.z = Math.sin(t * 1.8 + fan.phase) * 0.09;
    }
  }
}

type AdBoard = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
type AdBoardSlot = { mesh: AdBoard; slot: number };

// Los 20 espacios publicitarios, programados uno a uno (lado + posición -1..1).
const SPONSOR_SLOTS: Array<{ slot: number; side: "south" | "north" | "east" | "west"; at: number }> = [
  { slot: 1, side: "south", at: -0.83 }, { slot: 2, side: "south", at: -0.5 }, { slot: 3, side: "south", at: -0.17 },
  { slot: 4, side: "south", at: 0.17 }, { slot: 5, side: "south", at: 0.5 }, { slot: 6, side: "south", at: 0.83 },
  { slot: 7, side: "north", at: -0.83 }, { slot: 8, side: "north", at: -0.5 }, { slot: 9, side: "north", at: -0.17 },
  { slot: 10, side: "north", at: 0.17 }, { slot: 11, side: "north", at: 0.5 }, { slot: 12, side: "north", at: 0.83 },
  { slot: 13, side: "east", at: -0.72 }, { slot: 14, side: "east", at: -0.24 }, { slot: 15, side: "east", at: 0.24 }, { slot: 16, side: "east", at: 0.72 },
  { slot: 17, side: "west", at: -0.72 }, { slot: 18, side: "west", at: -0.24 }, { slot: 19, side: "west", at: 0.24 }, { slot: 20, side: "west", at: 0.72 },
];

/** Vallas publicitarias pegadas al muro interior de la cancha (detectado con rayos). */
function buildAdBoards(pitchY: number, model: THREE.Object3D): { root: THREE.Group; boards: AdBoardSlot[] } {
  const root = new THREE.Group();
  const boards: AdBoardSlot[] = [];
  const height = 1.6;
  const y = pitchY + 0.95;
  const margin = 0.45;
  const width = 8;

  const ray = new THREE.Raycaster();
  ray.near = 0;
  ray.far = 120;
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const castToWall = (x: number, z: number, dx: number, dz: number): number | null => {
    origin.set(x, pitchY + 0.7, z);
    dir.set(dx, 0, dz).normalize();
    ray.set(origin, dir);
    const hits = ray.intersectObject(model, true);
    if (!hits.length || hits[0].distance < 1) return null;
    return hits[0].distance;
  };

  const dNorth = castToWall(0, 0, 0, -1) ?? 36;
  const dSouth = castToWall(0, 0, 0, 1) ?? 36;
  const dEast = castToWall(0, 0, 1, 0) ?? 30;
  const dWest = castToWall(0, 0, -1, 0) ?? 30;
  const xWest = -dWest;
  const xEast = dEast;
  const zNorth = -dNorth;
  const zSouth = dSouth;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  for (const def of SPONSOR_SLOTS) {
    let x = 0;
    let z = 0;
    let rotY = 0;
    if (def.side === "south" || def.side === "north") {
      x = lerp(xWest, xEast, (def.at + 1) / 2);
      const distance = castToWall(x, 0, 0, def.side === "south" ? 1 : -1) ?? (def.side === "south" ? dSouth : dNorth);
      z = def.side === "south" ? distance - margin : -(distance - margin);
      rotY = def.side === "south" ? Math.PI : 0;
    } else {
      z = lerp(zNorth, zSouth, (def.at + 1) / 2);
      const distance = castToWall(0, z, def.side === "east" ? 1 : -1, 0) ?? (def.side === "east" ? dEast : dWest);
      x = def.side === "east" ? distance - margin : -(distance - margin);
      rotY = def.side === "east" ? -Math.PI / 2 : Math.PI / 2;
    }

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.visible = false; // solo se muestra cuando tiene patrocinador
    root.add(mesh);
    boards.push({ mesh, slot: def.slot });
  }

  return { root, boards };
}

export function PlayerWorld({ config, self }: { config: AvatarConfig | null; self: WorldIdentity | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyKnobRef = useRef<HTMLSpanElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const congratsRef = useRef<HTMLDivElement>(null);
  const promptKeyRef = useRef<HTMLSpanElement>(null);
  const promptLabelRef = useRef<HTMLSpanElement>(null);
  const activeInteractableRef = useRef<Interactable | null>(null);
  const modeRef = useRef<"third" | "first">("third");
  const menuOpenRef = useRef(false);
  const [menu, setMenu] = useState<{ player: WorldPlayerInfo; x: number; y: number } | null>(null);
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  const toggleMode = useCallback(() => {
    modeRef.current = modeRef.current === "third" ? "first" : "third";
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const skyDay = new THREE.Color(0x9fb6cc);
    const skyNight = new THREE.Color(0x141c2e);
    const sky = skyDay.clone();
    scene.background = sky;
    const fog = new THREE.Fog(skyDay.getHex(), 180, 460);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);

    const hemi = new THREE.HemisphereLight(0xdfeaff, 0x4a4438, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dc, 2);
    sun.position.set(90, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const shadowCam = sun.shadow.camera as THREE.OrthographicCamera;
    shadowCam.left = -210;
    shadowCam.right = 110;
    shadowCam.top = 110;
    shadowCam.bottom = -110;
    shadowCam.near = 1;
    shadowCam.far = 450;
    scene.add(sun);

    // Astro visible: sol de día, luna de noche.
    const celestialMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false });
    const celestial = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 18), celestialMat);
    celestial.position.set(60, 36, -90);
    scene.add(celestial);

    let isNight = false;
    const nightLights: THREE.PointLight[] = [];
    const applyTimeOfDay = () => {
      // Noche desde las 7pm (19:00) hasta las 6am
      const hour = new Date().getHours();
      const night = hour >= 19 || hour < 6;
      if (night === isNight) return;
      isNight = night;
      sky.copy(night ? skyNight : skyDay);
      fog.color.copy(night ? skyNight : skyDay);
      fog.near = night ? 130 : 180;
      fog.far = night ? 430 : 460;
      hemi.color.set(night ? 0x3a4a74 : 0xdfeaff);
      hemi.groundColor.set(night ? 0x14181f : 0x4a4438);
      hemi.intensity = night ? 0.95 : 1.0;
      sun.color.set(night ? 0xaebfff : 0xfff2dc);
      sun.intensity = night ? 1.0 : 2;
      sun.position.set(night ? -80 : 90, night ? 110 : 120, night ? -40 : 60);
      celestialMat.color.set(night ? 0xdfe8ff : 0xfff2b0);
      celestial.position.set(night ? -70 : 70, night ? 85 : 95, night ? -140 : -130);
      for (const light of nightLights) light.visible = night;
    };
    applyTimeOfDay();
    const timeTimer = window.setInterval(applyTimeOfDay, 60000);

    const colliders: Collider[] = [];
    const buildingSpecs: { x: number; z: number; bw: number; bd: number; clothing?: boolean }[] = [];
    let clothingSpec: { x: number; z: number; bw: number; bd: number; clothing?: boolean } | null = null;
    const rand = mulberry32(20260923);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_HALF * 2 + 24, WORLD_HALF * 2 + 24),
      new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    // Valla de atención en el borde del mundo
    const hazard = getHazardTexture();
    hazard.repeat.set((WORLD_HALF * 2) / 4, 1);
    const barrierMat = new THREE.MeshStandardMaterial({ map: hazard, roughness: 0.6, metalness: 0.2 });
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x4b5158, roughness: 0.6, metalness: 0.4 });
    const addBarrier = (x: number, z: number, horizontal: boolean) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(WORLD_HALF * 2, 0.7, 0.12), barrierMat);
      rail.position.set(x, 0.85, z);
      if (!horizontal) rail.rotation.y = Math.PI / 2;
      scene.add(rail);
      for (let t = -WORLD_HALF; t <= WORLD_HALF; t += 6) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), gateMat);
        post.position.set(horizontal ? t : x, 0.6, horizontal ? z : t);
        scene.add(post);
      }
    };
    addBarrier(0, -WORLD_HALF, true);
    addBarrier(0, WORLD_HALF, true);
    addBarrier(-WORLD_HALF, 0, false);
    addBarrier(WORLD_HALF, 0, false);
    colliders.push({ x: 0, z: -WORLD_HALF, hw: WORLD_HALF, hd: 0.6 });
    colliders.push({ x: 0, z: WORLD_HALF, hw: WORLD_HALF, hd: 0.6 });
    colliders.push({ x: -WORLD_HALF, z: 0, hw: 0.6, hd: WORLD_HALF });
    colliders.push({ x: WORLD_HALF, z: 0, hw: 0.6, hd: WORLD_HALF });

    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf4d35e });
    for (const road of [-SPACING / 2, SPACING / 2]) {
      for (let t = -SPACING - BLOCK / 2; t <= SPACING + BLOCK / 2; t += 9) {
        const v = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 4.5), dashMat);
        v.rotation.x = -Math.PI / 2;
        v.position.set(road, 0.02, t);
        scene.add(v);
        const h = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.4), dashMat);
        h.rotation.x = -Math.PI / 2;
        h.position.set(t, 0.02, road);
        scene.add(h);
      }
    }

    const lotMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 1 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3f9b45, roughness: 1 });

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.3, 6);
    const leafGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 1 });
    const bushGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const benchGroupGeo = new THREE.BoxGeometry(1.8, 0.14, 0.55);
    const benchBackGeo = new THREE.BoxGeometry(1.8, 0.5, 0.12);
    const benchLegGeo = new THREE.BoxGeometry(0.14, 0.45, 0.5);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x4b5158, roughness: 0.6, metalness: 0.4 });
    const lampPoleGeo = new THREE.CylinderGeometry(0.09, 0.12, 4.4, 6);
    const lampBulbGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffe08a, emissiveIntensity: 0.9 });
    const coneGeo = new THREE.ConeGeometry(0.22, 0.55, 8);
    const coneBaseGeo = new THREE.BoxGeometry(0.5, 0.06, 0.5);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xe4572e, roughness: 0.8 });
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
    const hydrantGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8);
    const panelGeo = new THREE.BoxGeometry(4, 2.4, 0.18);
    const panelPostGeo = new THREE.CylinderGeometry(0.09, 0.09, 3, 6);
    const adMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
    const waterTex = getWaterTexture();
    const waterMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x9fd8ff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.15,
      metalness: 0.1,
    });
    const jetMat = new THREE.MeshStandardMaterial({
      color: 0xbfe6ff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
    });
    const waterJets: THREE.Mesh[] = [];
    const dropGeo = new THREE.SphereGeometry(0.09, 8, 6);
    const drops: Array<{ mesh: THREE.Mesh; ox: number; oz: number; vx: number; vy: number; vz: number }> = [];
    const pigeonBodyMat = new THREE.MeshStandardMaterial({ color: 0xa7aeb8, roughness: 0.9 });
    const pigeonHeadMat = new THREE.MeshStandardMaterial({ color: 0x6b7480, roughness: 0.9 });
    const pigeonWingMat = new THREE.MeshStandardMaterial({ color: 0x8b939d, roughness: 0.9 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xe0a94b, roughness: 0.8 });
    const pigeons: Array<{
      group: THREE.Group;
      head: THREE.Object3D;
      wings: THREE.Mesh[];
      mode: "fly" | "feed";
      cx: number;
      cz: number;
      radius: number;
      angle: number;
      speed: number;
      phase: number;
    }> = [];

    const addPigeon = (cx: number, cz: number, mode: "fly" | "feed", seed: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), pigeonBodyMat);
      body.scale.set(1, 0.9, 1.5);
      const head = new THREE.Group();
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pigeonHeadMat);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0, 0.11);
      head.add(headMesh, beak);
      head.position.set(0, 0.12, 0.2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.2), pigeonWingMat);
      tail.position.set(0, 0.02, -0.26);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), pigeonWingMat);
      wingL.position.set(-0.17, 0.06, 0);
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), pigeonWingMat);
      wingR.position.set(0.17, 0.06, 0);
      group.add(body, head, tail, wingL, wingR);
      group.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
      const angle = seed * 1.7;
      if (mode === "feed") {
        group.position.set(cx + Math.cos(seed) * 3.2, 0.16, cz + Math.sin(seed) * 3.2);
        group.rotation.y = seed * 2;
      } else {
        group.position.set(cx + 6, 3.4, cz);
      }
      scene.add(group);
      pigeons.push({
        group,
        head,
        wings: [wingL, wingR],
        mode,
        cx,
        cz,
        radius: 6 + (seed % 1) * 4,
        angle,
        speed: 0.6 + (seed % 0.5),
        phase: seed * 3,
      });
    };

    const spawnDrop = (x: number, z: number) => {
      const mesh = new THREE.Mesh(dropGeo, waterMat);
      mesh.position.set(x, 2.2, z);
      scene.add(mesh);
      drops.push({
        mesh,
        ox: x,
        oz: z,
        vx: (rand() - 0.5) * 1.8,
        vy: 3 + rand() * 1.8,
        vz: (rand() - 0.5) * 1.8,
      });
    };

    const addTree = (x: number, z: number, scale = 1) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.65 * scale;
      trunk.scale.setScalar(scale);
      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.y = 1.85 * scale;
      leaves.scale.setScalar(scale);
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      tree.position.set(x, 0, z);
      scene.add(tree);
    };
    const addBush = (x: number, z: number) => {
      const bush = new THREE.Mesh(bushGeo, leafMat);
      bush.position.set(x, 0.45, z);
      bush.castShadow = true;
      scene.add(bush);
    };
    const benches: Array<{ x: number; z: number; rot: number }> = [];
    const addBench = (x: number, z: number, rot: number) => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(benchGroupGeo, woodMat);
      seat.position.y = 0.45;
      const back = new THREE.Mesh(benchBackGeo, woodMat);
      back.position.set(0, 0.72, -0.22);
      const leg1 = new THREE.Mesh(benchLegGeo, metalMat);
      leg1.position.set(-0.7, 0.22, 0);
      const leg2 = new THREE.Mesh(benchLegGeo, metalMat);
      leg2.position.set(0.7, 0.22, 0);
      bench.add(seat, back, leg1, leg2);
      bench.position.set(x, 0, z);
      bench.rotation.y = rot;
      bench.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
      scene.add(bench);
      benches.push({ x, z, rot });
    };
    const addLamp = (x: number, z: number, withLight = true) => {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(lampPoleGeo, metalMat);
      pole.position.y = 2.2;
      const bulb = new THREE.Mesh(lampBulbGeo, bulbMat);
      bulb.position.y = 4.4;
      lamp.add(pole, bulb);
      if (withLight) {
        const glow = new THREE.PointLight(0xffe6b0, 9, 14, 2);
        glow.position.y = 4.4;
        glow.visible = false;
        nightLights.push(glow);
        lamp.add(glow);
      }
      lamp.position.set(x, 0, z);
      scene.add(lamp);
    };
    const addCone = (x: number, z: number) => {
      const cone = new THREE.Group();
      const body = new THREE.Mesh(coneGeo, coneMat);
      body.position.y = 0.28;
      const base = new THREE.Mesh(coneBaseGeo, coneMat);
      base.position.y = 0.03;
      cone.add(body, base);
      cone.position.set(x, 0, z);
      scene.add(cone);
    };
    const addHydrant = (x: number, z: number) => {
      const hydrant = new THREE.Mesh(hydrantGeo, hydrantMat);
      hydrant.position.set(x, 0.35, z);
      hydrant.castShadow = true;
      scene.add(hydrant);
    };
    const addBillboard = (x: number, z: number, rot: number) => {
      const board = new THREE.Group();
      const panel = new THREE.Mesh(panelGeo, adMat);
      panel.position.y = 3.6;
      const post1 = new THREE.Mesh(panelPostGeo, metalMat);
      post1.position.set(-1.4, 1.5, 0);
      const post2 = new THREE.Mesh(panelPostGeo, metalMat);
      post2.position.set(1.4, 1.5, 0);
      board.add(panel, post1, post2);
      board.position.set(x, 0, z);
      board.rotation.y = rot;
      board.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
      scene.add(board);
      colliders.push({ x, z, hw: 2.2, hd: 0.4 });
    };

    for (let gi = -1; gi <= 1; gi += 1) {
      for (let gj = -1; gj <= 1; gj += 1) {
        const cx = gi * SPACING;
        const cz = gj * SPACING;
        const isCenter = gi === 0 && gj === 0;

        const lotSize = isCenter ? CENTER_BLOCK : BLOCK;
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(lotSize, lotSize), lotMat);
        lot.rotation.x = -Math.PI / 2;
        lot.position.set(cx, 0, cz);
        lot.receiveShadow = true;
        scene.add(lot);

        if (isCenter) continue;

        const cells = 2;
        const cell = BLOCK / cells;
        for (let a = 0; a < cells; a += 1) {
          for (let b = 0; b < cells; b += 1) {
            const bw = cell - 5 - rand() * 4;
            const bd = cell - 5 - rand() * 4;
            const ox = cx - BLOCK / 2 + cell * (a + 0.5);
            const oz = cz - BLOCK / 2 + cell * (b + 0.5);
            // Tienda de ropa: edificio esquinero del bloque justo al frente del estadio
            const clothing = gi === 0 && gj === 1 && a === 1 && b === 0;
            // Parque al pie del hotel: se elimina este edificio
            const isPark = gi === 0 && gj === 1 && a === 0 && b === 0;
            if (!isPark) {
              const spec = { x: ox, z: oz, bw, bd, clothing };
              buildingSpecs.push(spec);
              if (clothing) clothingSpec = spec;
            }
          }
        }

        // Árboles solo en el pasillo central entre edificios (nunca en la calle)
        const half = cell / 2;
        addTree(cx, cz - half, 0.9 + rand() * 0.4);
        addTree(cx, cz + half, 0.9 + rand() * 0.4);
        addTree(cx - half, cz, 0.9 + rand() * 0.4);
        addTree(cx + half, cz, 0.9 + rand() * 0.4);

        addBush(cx - SIDEWALK + 2, cz - SIDEWALK + 2);
        addBush(cx + SIDEWALK - 2, cz - SIDEWALK + 2);
        addBush(cx - SIDEWALK + 2, cz + SIDEWALK - 2);
        addBush(cx + SIDEWALK - 2, cz + SIDEWALK - 2);

        // Parquecito en el cruce interno: caminito verde, fuente y flores
        const crossW = 4.6;
        const crossLen = BLOCK - 10;
        const stripV = new THREE.Mesh(new THREE.PlaneGeometry(crossW, crossLen), grassMat);
        stripV.rotation.x = -Math.PI / 2;
        stripV.position.set(cx, 0.004, cz);
        scene.add(stripV);
        const stripH = new THREE.Mesh(new THREE.PlaneGeometry(crossLen, crossW), grassMat);
        stripH.rotation.x = -Math.PI / 2;
        stripH.position.set(cx, 0.004, cz);
        scene.add(stripH);

        const pathMat = new THREE.MeshStandardMaterial({ color: 0xc9b78f, roughness: 1 });
        const pathV = new THREE.Mesh(new THREE.PlaneGeometry(2, crossLen), pathMat);
        pathV.rotation.x = -Math.PI / 2;
        pathV.position.set(cx, 0.008, cz);
        scene.add(pathV);
        const pathH = new THREE.Mesh(new THREE.PlaneGeometry(crossLen, 2), pathMat);
        pathH.rotation.x = -Math.PI / 2;
        pathH.position.set(cx, 0.008, cz);
        scene.add(pathH);

        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.9 });
        const fountain = new THREE.Group();
        const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.5, 18), stoneMat);
        basin.position.y = 0.25;
        const water = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.14, 18), waterMat);
        water.position.y = 0.52;
        const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 10), stoneMat);
        spout.position.y = 0.85;
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), stoneMat);
        top.position.y = 1.35;
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.9, 10), jetMat);
        jet.position.y = 1.75;
        waterJets.push(jet);
        fountain.add(basin, water, spout, top, jet);
        fountain.position.set(cx, 0, cz);
        fountain.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        scene.add(fountain);
        colliders.push({ x: cx, z: cz, hw: 1.8, hd: 1.8 });
        for (let d = 0; d < 7; d += 1) spawnDrop(cx, cz);
        addPigeon(cx, cz, "feed", 1.2);
        addPigeon(cx, cz, "feed", 3.4);
        addPigeon(cx, cz, "fly", 0.7);

        const flowerColors = [0xef5b5b, 0xf5c518, 0xe17bd8, 0xffffff, 0x7bc8f5];
        for (let f = 0; f < 8; f += 1) {
          const side = f % 2 === 0 ? 1 : -1;
          const fx = cx + side * (crossW / 2 - 0.5) + (rand() - 0.5);
          const fz = cz + (f - 3.5) * 2.2;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), leafMat);
          stem.position.set(fx, 0.2, fz);
          const bloom = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 8, 6),
            new THREE.MeshStandardMaterial({ color: flowerColors[f % flowerColors.length], roughness: 0.8 }),
          );
          bloom.position.set(fx, 0.42, fz);
          scene.add(stem, bloom);
        }

        addBench(cx, cz - 4.4, 0);
        addBench(cx, cz + 4.4, Math.PI);

        // Props sobre el andén (borde interior del cuadro)
        addLamp(cx - SIDEWALK, cz - 14);
        addLamp(cx - SIDEWALK, cz + 14, false);
        addLamp(cx + SIDEWALK, cz - 14, false);
        addLamp(cx + SIDEWALK, cz + 14);
        addLamp(cx - 14, cz - SIDEWALK, false);
        addLamp(cx + 14, cz - SIDEWALK, false);
        addLamp(cx - 14, cz + SIDEWALK, false);
        addLamp(cx + 14, cz + SIDEWALK, false);

        addBench(cx - 6, cz + SIDEWALK, 0);
        addBench(cx + 6, cz + SIDEWALK, 0);
        addBench(cx - 6, cz - SIDEWALK, Math.PI);
        addBench(cx + 6, cz - SIDEWALK, Math.PI);

        addHydrant(cx - SIDEWALK + 1, cz);
        addHydrant(cx + SIDEWALK - 1, cz);
        addCone(cx - 3, cz + SIDEWALK - 1);
        addCone(cx + 3, cz - SIDEWALK + 1);
      }
    }

    // NPC "Guardia del Hotel": es el acceso al hotel
    const npc = new THREE.Group();
    const npcBodyMat = new THREE.MeshStandardMaterial({ color: 0x1f3a5f, roughness: 0.85 });
    const npcSkinMat = new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: 0.85 });
    const npcHairMat = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.9 });
    const npcTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 6, 12), npcBodyMat);
    npcTorso.position.y = 1.15;
    const npcHead = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), npcSkinMat);
    npcHead.position.y = 1.82;
    const npcHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      npcHairMat,
    );
    npcHair.position.y = 1.86;
    const npcCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.31, 0.14, 18),
      new THREE.MeshStandardMaterial({ color: 0x0f1b2d, roughness: 0.8 }),
    );
    npcCap.position.y = 2.04;
    const npcArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), npcBodyMat);
    npcArmL.position.set(-0.42, 1.2, 0);
    const npcArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), npcBodyMat);
    npcArmR.position.set(0.42, 1.2, 0);
    npc.add(npcTorso, npcHead, npcHair, npcCap, npcArmL, npcArmR);
    npc.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
    npc.position.set(
      clothingSpec ? clothingSpec.x + 1.6 : 17.6,
      0,
      clothingSpec ? clothingSpec.z - clothingSpec.bd / 2 - 1 : 70,
    );
    npc.rotation.y = Math.PI;
    scene.add(npc);

    // Parque al pie del hotel (se eliminó el edificio de esa esquina)
    const parkX = -16;
    const parkZ = 84;
    const parkGrass = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), grassMat);
    parkGrass.rotation.x = -Math.PI / 2;
    parkGrass.position.set(parkX, 0.006, parkZ);
    parkGrass.receiveShadow = true;
    scene.add(parkGrass);
    for (const [dx, dz] of [
      [-12, -12], [12, -12], [-12, 12], [12, 12],
      [-4, -13], [4, -13], [-13, -4], [-13, 4], [13, -4], [13, 4], [-4, 13], [4, 13],
      [-8, -8], [8, 8],
    ]) {
      addTree(parkX + dx, parkZ + dz, 0.85 + rand() * 0.5);
    }
    for (const [dx, dz] of [[-5, 7], [5, 7], [-7, -6], [7, -6], [-10, 0], [10, 0], [0, 10], [-9, 9], [9, -9]]) {
      addBush(parkX + dx, parkZ + dz);
    }
    // Fuente central del parque
    const parkFountain = new THREE.Group();
    const pfBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.5, 18), new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.9 }));
    pfBasin.position.y = 0.25;
    const pfWater = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.14, 18), waterMat);
    pfWater.position.y = 0.52;
    const pfSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0xbfc3c7 }));
    pfSpout.position.y = 0.9;
    const pfJet = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.9, 10), jetMat);
    pfJet.position.y = 1.75;
    waterJets.push(pfJet);
    parkFountain.add(pfBasin, pfWater, pfSpout, pfJet);
    parkFountain.position.set(parkX, 0, parkZ);
    parkFountain.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    scene.add(parkFountain);
    for (let d = 0; d < 7; d += 1) spawnDrop(parkX, parkZ);
    colliders.push({ x: parkX, z: parkZ, hw: 2, hd: 2 });
    addBench(parkX - 4, parkZ + 3, 0);
    addBench(parkX + 4, parkZ + 3, 0);
    addBench(parkX, parkZ + 9, Math.PI);
    addLamp(parkX - 11, parkZ + 11);
    addLamp(parkX + 11, parkZ + 11);
    addLamp(parkX - 11, parkZ - 11);
    addLamp(parkX + 11, parkZ - 11);

    // Decoración del hotel: luces, bancos y árboles
    const hotelX = 16;
    const hotelZ = 84;
    addLamp(hotelX - 13, hotelZ + 13);
    addLamp(hotelX + 13, hotelZ + 13);
    addLamp(hotelX - 13, hotelZ - 13);
    addLamp(hotelX + 13, hotelZ - 13);
    addBench(hotelX - 6, hotelZ - 14, 0);
    addBench(hotelX + 6, hotelZ - 14, 0);
    addTree(hotelX - 15, hotelZ + 2, 1.1);
    addTree(hotelX + 15, hotelZ + 2, 1.1);
    addTree(hotelX - 15, hotelZ - 8, 1.0);
    addTree(hotelX + 15, hotelZ - 8, 1.0);

    // Profesor de la lección "Escribe como crack"
    const teacherX = parkX;
    const teacherZ = parkZ - 6;
    const teacher = new THREE.Group();
    const tShirtMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.85 });
    const tSkinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.85 });
    const tHairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
    const tTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 6, 12), tShirtMat);
    tTorso.position.y = 1.15;
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), tSkinMat);
    tHead.position.y = 1.82;
    const tHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      tHairMat,
    );
    tHair.position.y = 1.86;
    const tGlasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 }),
    );
    tGlasses.position.set(0, 1.84, 0.26);
    const tArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), tShirtMat);
    tArmL.position.set(-0.42, 1.2, 0);
    const tArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), tShirtMat);
    tArmR.position.set(0.42, 1.2, 0);
    teacher.add(tTorso, tHead, tHair, tGlasses, tArmL, tArmR);
    teacher.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
    teacher.position.set(teacherX, 0, teacherZ);
    teacher.rotation.y = Math.PI / 2;
    teacher.visible = false;
    scene.add(teacher);

    let lessonTitle = "Escribe como crack";
    let lessonId: string | null = null;
    let lessonActive = false;
    let lessonStarted = false;
    let celebrateUntil = 0;
    const teacherInteractable: Interactable = {
      x: teacherX,
      z: teacherZ,
      y: 2.4,
      radius: 3.2,
      key: "E",
      action: () => {
        window.dispatchEvent(new CustomEvent("goal50:lesson", { detail: { lessonId } }));
      },
      label: () => `Ir a Lección: ${lessonTitle}`,
      enabled: () => teacher.visible && lessonActive,
    };

    // Flecha que señala al profesor
    const lessonArrow = new THREE.Group();
    const arrowCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.9, 4),
      new THREE.MeshBasicMaterial({ color: 0xc6f232 }),
    );
    arrowCone.rotation.x = Math.PI;
    arrowCone.position.y = 3.4;
    lessonArrow.add(arrowCone);
    lessonArrow.visible = false;
    scene.add(lessonArrow);

    // Interactuable del guardia: abre la ventana del hotel (se reubica al colocar el edificio)
    const npcInteractable: Interactable = {
      x: npc.position.x,
      z: npc.position.z,
      y: 2.5,
      radius: 2.9,
      key: "E",
      action: () => {
        window.dispatchEvent(new CustomEvent("goal50:hotel"));
      },
      label: () => "Entrar al hotel",
    };

    // Edificios: instancias de prefabs PolyCity (edificio genérico + hotel)
    const textureLoader = new THREE.TextureLoader();
    const buildingTexture = textureLoader.load("/models/polycity/Building_Sky_big_color01.png");
    buildingTexture.colorSpace = THREE.SRGBColorSpace;
    buildingTexture.magFilter = THREE.NearestFilter;
    const getHotelTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      const base = new Image();
      base.onload = () => {
        if (!ctx) return;
        ctx.drawImage(base, 0, 0, 512, 512);
        const logo = new Image();
        logo.onload = () => {
          // Reemplaza el cartel "CLOTHING" por el de entradahotel
          ctx.fillStyle = "#141414";
          ctx.fillRect(19, 132, 337 - 19, 244 - 132);
          const pad = 8;
          const boxW = 337 - 19 - pad * 2;
          const boxH = 244 - 132 - pad * 2;
          const aspect = logo.width / logo.height;
          let dw = boxW;
          let dh = dw / aspect;
          if (dh > boxH) {
            dh = boxH;
            dw = dh * aspect;
          }
          ctx.drawImage(logo, 19 + pad + (boxW - dw) / 2, 132 + pad + (boxH - dh) / 2, dw, dh);
          texture.needsUpdate = true;
        };
        logo.src = "/img/emotes/entradahotel.png";
        texture.needsUpdate = true;
      };
      base.src = "/models/polycity/Building_Clothing.png";
      return texture;
    };
    const clothingTexture = getHotelTexture();

    const loadFbx = (url: string) =>
      new Promise<THREE.Group>((resolve, reject) => {
        new FBXLoader().load(url, resolve, undefined, reject);
      });

    const prepareBuilding = (template: THREE.Group, texture: THREE.Texture) => {
      template.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const apply = (mat: THREE.Material) => {
          const std = mat as THREE.MeshStandardMaterial;
          std.map = texture;
          std.color?.set(0xffffff);
          std.metalness = 0;
          std.roughness = 0.9;
          std.needsUpdate = true;
        };
        if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
        else if (mesh.material) apply(mesh.material);
      });
      const bounds = new THREE.Box3().setFromObject(template);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      return { template, sx: Math.max(size.x, 0.001), sz: Math.max(size.z, 0.001), baseY: bounds.min.y, center };
    };

    const placeBuilding = (
      prep: ReturnType<typeof prepareBuilding>,
      spec: { x: number; z: number; bw: number; bd: number; clothing?: boolean },
      rotationY = 0,
    ) => {
      const scale = Math.min(spec.bw / prep.sx, spec.bd / prep.sz);
      const clone = prep.template.clone(true);
      clone.scale.setScalar(scale);
      clone.position.set(
        -prep.center.x * scale,
        -prep.baseY * scale + 0.02,
        -prep.center.z * scale,
      );
      clone.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      const wrapper = new THREE.Group();
      wrapper.add(clone);
      wrapper.position.set(spec.x, 0, spec.z);
      wrapper.rotation.y = rotationY;
      scene.add(wrapper);
      const halfW = (prep.sx * scale) / 2;
      const halfD = (prep.sz * scale) / 2;

      colliders.push({ x: spec.x, z: spec.z, hw: halfW, hd: halfD });

      if (spec.clothing) {
        const frontZ = spec.z - halfD;
        npc.position.set(spec.x + 1.6, 0, frontZ - 1.0);
        npcInteractable.x = npc.position.x;
        npcInteractable.z = npc.position.z;
      }
    };

    Promise.all([
      loadFbx("/models/polycity/Building_Sky_big_color01.fbx"),
      loadFbx("/models/polycity/Building_Clothing.fbx"),
    ])
      .then(([defaultFbx, clothingFbx]) => {
        const defaultPrep = prepareBuilding(defaultFbx, buildingTexture);
        const clothingPrep = prepareBuilding(clothingFbx, clothingTexture);
        for (const spec of buildingSpecs) {
          placeBuilding(spec.clothing ? clothingPrep : defaultPrep, spec, spec.clothing ? Math.PI : 0);
        }
      })
      .catch((error) => console.error("player-world: error cargando los edificios PolyCity", error));

    const outer = SPACING + SIDEWALK;
    addBillboard(-SPACING, -outer, 0);
    addBillboard(SPACING, -outer, 0);
    addBillboard(-SPACING, outer, Math.PI);
    addBillboard(SPACING, outer, Math.PI);
    addBillboard(-outer, -SPACING, Math.PI / 2);
    addBillboard(-outer, SPACING, Math.PI / 2);
    addBillboard(outer, -SPACING, -Math.PI / 2);
    addBillboard(outer, SPACING, -Math.PI / 2);

    const raycaster = new THREE.Raycaster();
    let stadiumObject: THREE.Object3D | null = null;

    // Altura de la superficie superior del estadio (sin cancha encima)
    let stadiumTopY = 0;

    // Grada animada.
    const crowdFans: CrowdFan[] = [];

    // Vallas publicitarias.
    const adBoards: AdBoardSlot[] = [];
    const adTexturesBySlot = new Map<number, THREE.Texture>();
    const applyAds = () => {
      for (const board of adBoards) {
        const texture = adTexturesBySlot.get(board.slot);
        board.mesh.material.map = texture ?? null;
        board.mesh.material.color.set(0xffffff);
        board.mesh.material.needsUpdate = true;
        board.mesh.visible = Boolean(texture);
      }
    };

    // Jugadores en línea: presencia y posición en tiempo real (Colyseus).
    const remotePlayers = new Map<string, RemotePlayer>();
    let mySessionId = "";
    let room: LobbyRoomClient | null = null;
    let moveSendTimer = 0;
    let cancelled = false;
    const parseConfig = (raw: string): AvatarConfig => {
      try {
        return parseAvatarConfig(JSON.parse(raw)) ?? DEFAULT_AVATAR_CONFIG;
      } catch {
        return DEFAULT_AVATAR_CONFIG;
      }
    };
    const reconcile = (json: string) => {
      let list: RemoteEntry[] = [];
      try {
        list = JSON.parse(json) as RemoteEntry[];
      } catch {
        list = [];
      }
      const seen = new Set<string>();
      for (const entry of list) {
        if (!entry || entry.sessionId === mySessionId) continue;
        seen.add(entry.sessionId);
        const ex = Number.isFinite(entry.x) ? entry.x : 0;
        const ez = Number.isFinite(entry.z) ? entry.z : 52;
        const erot = Number.isFinite(entry.rot) ? entry.rot : 0;
        let player = remotePlayers.get(entry.sessionId);
        if (!player) {
          try {
            const human = new LowpolyHuman({ config: parseConfig(entry.config), height: 1.8 });
            human.object3D.position.set(ex, 0, ez);
            human.object3D.rotation.y = erot;
            scene.add(human.object3D);
            player = {
              human,
              data: {
                id: entry.userId || entry.sessionId,
                name: entry.name,
                username: entry.username ?? "",
                teamName: entry.team || null,
                teamLogoUrl: entry.teamLogo || null,
                account: Boolean(entry.userId),
              },
              target: new THREE.Vector3(ex, 0, ez),
              rotTarget: erot,
              phase: 0,
            };
            remotePlayers.set(entry.sessionId, player);
          } catch (error) {
            console.error("player-world: no se pudo crear el jugador remoto", error);
            continue;
          }
        } else if (entry.userId) {
          // El userId puede llegar después del primer estado; se corrige en vivo.
          player.data.id = entry.userId;
          player.data.username = entry.username ?? player.data.username;
          player.data.account = true;
        }
        player.target.set(ex, 0, ez);
        player.rotTarget = erot;
      }
      console.info("[player-world] jugadores en línea:", remotePlayers.size);
      for (const [sessionId, player] of remotePlayers) {
        if (seen.has(sessionId)) continue;
        scene.remove(player.human.object3D);
        player.human.dispose();
        remotePlayers.delete(sessionId);
      }
    };

    const stadiumTexture = getStadiumTexture();
    const signTexture = new THREE.TextureLoader().load("/img/emotes/estadioentr.png");
    signTexture.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, side: THREE.DoubleSide });

    new GLTFLoader().load(
      "/models/building-stadium.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh) return;
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.map = stadiumTexture;
          material.color.set(0xffffff);
          material.metalness = 0;
          material.roughness = 0.9;
          material.alphaTest = 0.5;
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        fitToFootprint(model, CENTER_BLOCK + 8);
        model.position.y += 0.02;
        scene.add(model);
        stadiumObject = model;

        // Altura de la superficie superior del estadio
        raycaster.set(new THREE.Vector3(0, 300, 0), new THREE.Vector3(0, -1, 0));
        raycaster.near = 0;
        raycaster.far = 600;
        const hits = raycaster.intersectObject(model, true);
        stadiumTopY = hits.length ? hits[0].point.y : 0;
        ball.position.y = stadiumTopY + BALL_RADIUS;

        // Grada con afición animada (saltos, celebración y apoyo).
        scene.add(buildCrowd(stadiumTopY, crowdFans, model));

        // Vallas publicitarias con los patrocinadores.
        const adBoardsBuilt = buildAdBoards(stadiumTopY, model);
        scene.add(adBoardsBuilt.root);
        adBoards.push(...adBoardsBuilt.boards);
        applyAds();
      },
      undefined,
      (error) => console.error("player-world: error cargando el estadio", error),
    );

    // Pórtico y carteles de entrada (estadioentr.png). El estadio es sólido por geometría real.
    const arch = new THREE.Group();
    const ARCH_Z = 42;
    const pillarGeo = new THREE.BoxGeometry(1, 8, 1);
    const pillarL = new THREE.Mesh(pillarGeo, gateMat);
    pillarL.position.set(-7, 4, ARCH_Z);
    const pillarR = new THREE.Mesh(pillarGeo, gateMat);
    pillarR.position.set(7, 4, ARCH_Z);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 1), gateMat);
    beam.position.set(0, 8, ARCH_Z);
    arch.add(pillarL, pillarR, beam);
    arch.traverse((n) => { const m = n as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
    scene.add(arch);

    // Aviso de entrada estadioentr.png a la altura de la vista (solo por fuera)
    const signPanelGeo = new THREE.PlaneGeometry(13, 5.3);
    const signOut = new THREE.Mesh(signPanelGeo, signMat);
    signOut.position.set(0, 3.4, ARCH_Z + 2.5);
    scene.add(signOut);
    const signPostGeo = new THREE.BoxGeometry(0.3, 3.4, 0.3);
    for (const sx of [-6, 6]) {
      const postOut = new THREE.Mesh(signPostGeo, gateMat);
      postOut.position.set(sx, 1.7, ARCH_Z + 2.5);
      scene.add(postOut);
    }

    // Punto de aparición con un pequeño desfase para no solaparse con otros jugadores.
    const spawnX = (Math.random() - 0.5) * 6;
    const spawnZ = 52 + (Math.random() - 0.5) * 6;

    const human = new LowpolyHuman({ config: config ?? DEFAULT_AVATAR_CONFIG, height: 1.8 });
    human.object3D.position.set(spawnX, 0, spawnZ);
    human.object3D.rotation.y = Math.PI;
    scene.add(human.object3D);

    // Presencia en tiempo real: conecta al lobby del mundo.
    // Si el servidor no está disponible, cae a jugadores demo del servidor web.
    const addRemote = (id: string, other: LowpolyHuman, data: WorldPlayerInfo, x: number, z: number, rot: number) => {
      other.object3D.position.set(x, 0, z);
      other.object3D.rotation.y = rot;
      other.object3D.userData.player = true;
      scene.add(other.object3D);
      remotePlayers.set(id, {
        human: other,
        data,
        target: new THREE.Vector3(x, 0, z),
        rotTarget: rot,
        phase: 0,
      });
    };
    const loadStaticPlayers = async () => {
      try {
        const res = await fetch("/api/players", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          players?: Array<{
            id: string;
            name: string;
            username: string;
            avatarConfig: AvatarConfig;
            teamName: string | null;
            teamLogoUrl: string | null;
          }>;
        };
        const spots: Array<[number, number]> = [[-7, 18], [8, 16], [-11, 28], [11, 26], [0, 33]];
        for (const [index, player] of (payload.players ?? []).entries()) {
          const spot = spots[index % spots.length] ?? [0, 28];
          addRemote(
            `static-${player.id}`,
            new LowpolyHuman({ config: player.avatarConfig ?? DEFAULT_AVATAR_CONFIG, height: 1.8 }),
            { id: player.id, name: player.name, username: player.username, teamName: player.teamName, teamLogoUrl: player.teamLogoUrl },
            spot[0],
            spot[1],
            Math.atan2(-spot[0], -spot[1]),
          );
        }
      } catch {
        /* sin jugadores */
      }
    };

    (async () => {
      try {
        const sdk = await import("@colyseus/sdk");
        if (cancelled) return;
        const client = new sdk.Client(COLYSEUS_URL);
        const joined = (await client.joinOrCreate(WORLD_ROOM, {
          userId: self?.id ?? "",
          name: self?.name ?? "Crack",
          username: self?.username ?? "",
          team: self?.teamName ?? "",
          teamLogo: self?.teamLogoUrl ?? "",
          avatar: JSON.stringify(config ?? DEFAULT_AVATAR_CONFIG),
          x: spawnX,
          z: spawnZ,
          rot: Math.PI,
        })) as unknown as LobbyRoomClient;
        if (cancelled) {
          joined.leave();
          return;
        }
        room = joined;
        mySessionId = joined.sessionId;
        joined.onStateChange((state) => reconcile(String(state?.avatarsJson ?? "[]")));
        joined.onError(() => {
          /* se mantiene la última presencia conocida */
        });
      } catch (error) {
        console.warn("player-world: no se pudo conectar al servidor multijugador", error);
        if (!cancelled) void loadStaticPlayers();
      }
    })();

    // Patrocinadores: cada logo se coloca en su espacio (1-20).
    const adTextureLoader = new THREE.TextureLoader();
    fetch("/api/sponsors", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: { sponsors?: Array<{ imageUrl: string; slot: number }> }) => {
        for (const sponsor of payload.sponsors ?? []) {
          if (!sponsor.slot || sponsor.slot < 1 || sponsor.slot > 20) continue;
          const texture = adTextureLoader.load(sponsor.imageUrl);
          texture.colorSpace = THREE.SRGBColorSpace;
          adTexturesBySlot.set(sponsor.slot, texture);
        }
        applyAds();
      })
      .catch(() => {
        /* sin patrocinadores */
      });

    // Selección de jugadores: hover muestra un círculo en el suelo y el clic
    // normal abre el menú de opciones (excepto sobre uno mismo).
    const menuRaycaster = new THREE.Raycaster();
    const menuNdc = new THREE.Vector2();
    const menuProjected = new THREE.Vector3();
    const selectRing = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.82, 40),
      new THREE.MeshBasicMaterial({ color: 0xc6f232, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    );
    selectRing.rotation.x = -Math.PI / 2;
    selectRing.visible = false;
    scene.add(selectRing);

    let hoveredSession: string | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let pointerInside = false;

    const groundYAt = (x: number, z: number) =>
      Math.abs(x) < 46 && Math.abs(z) < 46 ? stadiumTopY : 0;

    const pickPlayer = (): string | null => {
      if (remotePlayers.size === 0) return null;
      const rect = container.getBoundingClientRect();
      const px = pointerX - rect.left;
      const py = pointerY - rect.top;
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      menuNdc.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
      menuRaycaster.setFromCamera(menuNdc, camera);

      let best: string | null = null;
      let bestDistance = Infinity;
      for (const [sessionId, player] of remotePlayers) {
        const hits = menuRaycaster.intersectObject(player.human.object3D, true);
        if (hits.length > 0 && hits[0].distance < bestDistance) {
          bestDistance = hits[0].distance;
          best = sessionId;
        }
      }
      if (best) return best;

      // Respaldo: jugador proyectado más cercano al puntero (~90 px).
      let nearest = 90;
      for (const [sessionId, player] of remotePlayers) {
        menuProjected.setFromMatrixPosition(player.human.object3D.matrixWorld);
        menuProjected.y += 1;
        menuProjected.project(camera);
        if (menuProjected.z > 1) continue;
        const sx = (menuProjected.x * 0.5 + 0.5) * rect.width;
        const sy = (-menuProjected.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(sx - px, sy - py);
        if (distance < nearest) {
          nearest = distance;
          best = sessionId;
        }
      }
      return best;
    };

    const updateHover = () => {
      if (!pointerInside) {
        hoveredSession = null;
        selectRing.visible = false;
        return;
      }
      hoveredSession = pickPlayer();
      const player = hoveredSession ? remotePlayers.get(hoveredSession) : null;
      if (player) {
        const object = player.human.object3D;
        selectRing.position.set(object.position.x, groundYAt(object.position.x, object.position.z) + 0.04, object.position.z);
        selectRing.visible = true;
      } else {
        selectRing.visible = false;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerInside = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      hoveredSession = null;
      selectRing.visible = false;
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerInside = true;
      updateHover();
      const player = hoveredSession ? remotePlayers.get(hoveredSession) : null;
      if (player) {
        event.preventDefault();
        menuOpenRef.current = true;
        setMenu({ player: player.data, x: event.clientX, y: event.clientY });
      } else {
        menuOpenRef.current = false;
        setMenu(null);
      }
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("click", onClick);

    const ball = new THREE.Group();
    ball.position.set(0, BALL_RADIUS, 16);
    const ballFallback = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 24, 18),
      new THREE.MeshStandardMaterial({ map: getBallTexture(), color: 0xffffff, roughness: 0.55 }),
    );
    ballFallback.castShadow = true;
    ball.add(ballFallback);
    scene.add(ball);

    // El balón 3D es un extra decorativo: si la descarga falla (red lenta,
    // recarga en desarrollo, etc.) se conserva la esfera de respaldo y se
    // reintenta una vez sin ensuciar la consola con un error.
    const ballLoader = new GLTFLoader();
    const loadBallModel = (attempt: number) => {
      ballLoader.load(
        "/balls/soccer_ball.glb",
        (gltf) => {
          if (cancelled) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.scale.setScalar((BALL_RADIUS * 2) / maxDim);
          const scaled = new THREE.Box3().setFromObject(model);
          const center = scaled.getCenter(new THREE.Vector3());
          model.position.sub(center);
          model.traverse((node) => {
            const mesh = node as THREE.Mesh;
            if (mesh.isMesh) mesh.castShadow = true;
          });
          ball.remove(ballFallback);
          ballFallback.geometry.dispose();
          (ballFallback.material as THREE.Material).dispose();
          ball.add(model);
        },
        undefined,
        (error) => {
          // Un aborto por desmontaje no es un fallo real.
          if (cancelled) return;
          if (attempt < 2) {
            window.setTimeout(() => loadBallModel(attempt + 1), 1500);
            return;
          }
          console.warn("player-world: se usa la esfera de respaldo; no se pudo cargar el balón 3D", error);
        },
      );
    };
    loadBallModel(0);
    const ballVelocity = new THREE.Vector3();

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "v") {
        toggleMode();
        return;
      }
      if (key === "e") {
        activeInteractableRef.current?.action();
        return;
      }
      keys.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onStartLesson = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; lessonId?: string; lessonType?: string }>).detail;
      if (detail?.title) lessonTitle = detail.title;
      lessonId = detail?.lessonId ?? null;
      // Las lecciones de "Habla como crack" (speaking) aparecen al pie de la fuente del parque
      if (detail?.lessonType === "SPEAKING") {
        teacher.position.set(parkX, 0, parkZ - 2.9);
        teacherInteractable.x = parkX;
        teacherInteractable.z = parkZ - 2.9;
      } else {
        const tx = parkX + (rand() - 0.5) * 18;
        const tz = parkZ + (rand() - 0.5) * 18;
        teacher.position.set(tx, 0, tz);
        teacherInteractable.x = tx;
        teacherInteractable.z = tz;
      }
      teacher.visible = true;
      lessonActive = true;
      lessonStarted = true;
      // Lleva al jugador al parque
      human.object3D.position.set(parkX, 0, parkZ + 12);
      human.object3D.rotation.y = Math.PI;
      lessonArrow.visible = true;
    };
    window.addEventListener("goal50:start-lesson", onStartLesson);

    const onLessonComplete = () => {
      lessonActive = false;
      lessonArrow.visible = false;
    };
    const onCloseLesson = () => {
      if (!lessonStarted) return;
      lessonStarted = false;
      celebrateUntil = performance.now() + 5000;
      if (congratsRef.current) congratsRef.current.style.display = "block";
    };
    window.addEventListener("goal50:lesson-complete", onLessonComplete);
    window.addEventListener("goal50:close-lesson", onCloseLesson);

    const joy = { x: 0, y: 0, active: false, id: -1 };
    const knob = joyKnobRef.current;
    const setKnob = (x: number, y: number) => {
      if (knob) knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };
    const updateJoy = (event: PointerEvent) => {
      const base = joyBaseRef.current;
      if (!base) return;
      const bounds = base.getBoundingClientRect();
      const cx = bounds.left + bounds.width / 2;
      const cy = bounds.top + bounds.height / 2;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const max = bounds.width / 2;
      const length = Math.hypot(dx, dy);
      if (length > max) {
        dx = (dx / length) * max;
        dy = (dy / length) * max;
      }
      joy.x = dx / max;
      joy.y = dy / max;
      setKnob(dx, dy);
    };
    const onJoyDown = (event: PointerEvent) => {
      joy.active = true;
      joy.id = event.pointerId;
      joyBaseRef.current?.setPointerCapture(event.pointerId);
      updateJoy(event);
    };
    const onJoyMove = (event: PointerEvent) => {
      if (!joy.active || event.pointerId !== joy.id) return;
      updateJoy(event);
    };
    const onJoyUp = (event: PointerEvent) => {
      if (event.pointerId !== joy.id) return;
      joy.active = false;
      joy.id = -1;
      joy.x = 0;
      joy.y = 0;
      setKnob(0, 0);
    };
    const joyBase = joyBaseRef.current;
    joyBase?.addEventListener("pointerdown", onJoyDown);
    joyBase?.addEventListener("pointermove", onJoyMove);
    joyBase?.addEventListener("pointerup", onJoyUp);
    joyBase?.addEventListener("pointercancel", onJoyUp);

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const avatar = human.object3D;
    const forward = new THREE.Vector3();
    const desiredCam = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const proposed = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const bubbleVec = new THREE.Vector3();
    const rayOrigin = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    const DOWN = new THREE.Vector3(0, -1, 0);
    const clock = new THREE.Clock();
    let walkPhase = 0;
    let camYaw = 0;
    let camPitch = 0;
    let raf = 0;
    let cameraReady = false;
    let groundY = 0;

    const resolveCollisions = (pos: THREE.Vector3) => {
      for (const c of colliders) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const px = c.hw + AVATAR_RADIUS - Math.abs(dx);
        const pz = c.hd + AVATAR_RADIUS - Math.abs(dz);
        if (px > 0 && pz > 0) {
          if (px < pz) pos.x += dx >= 0 ? px : -px;
          else pos.z += dz >= 0 ? pz : -pz;
        }
      }
    };

    let seated = false;
    let sitBench: { x: number; z: number; rot: number } | null = null;
    const SIT_Y = -0.35;

    const toggleSit = () => {
      if (seated) {
        seated = false;
        if (sitBench) {
          avatar.position.x = sitBench.x + Math.sin(sitBench.rot) * 1.1;
          avatar.position.z = sitBench.z + Math.cos(sitBench.rot) * 1.1;
        }
        avatar.position.y = 0;
        human.stand();
        sitBench = null;
        return;
      }
      let best: { x: number; z: number; rot: number } | null = null;
      let bestDist = 1.9;
      for (const b of benches) {
        const d = Math.hypot(avatar.position.x - b.x, avatar.position.z - b.z);
        if (d < bestDist) {
          bestDist = d;
          best = b;
        }
      }
      if (!best) return;
      seated = true;
      sitBench = best;
      avatar.position.set(best.x, SIT_Y, best.z);
      avatar.rotation.y = best.rot;
      human.sit();
    };
    const interactables: Interactable[] = [
      npcInteractable,
      teacherInteractable,
      ...benches.map((b) => ({
        x: b.x,
        z: b.z,
        y: 1.5,
        radius: 1.9,
        key: "E",
        action: toggleSit,
        label: () => (seated ? "Levantarse" : "Sentarse"),
      })),
    ];

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      let move = 0;
      let turn = 0;
      const orbiting = keys.has("q") && !seated;
      if (orbiting) {
        if (keys.has("a") || keys.has("arrowleft")) camYaw += 1.8 * dt;
        if (keys.has("d") || keys.has("arrowright")) camYaw -= 1.8 * dt;
        if (keys.has("w") || keys.has("arrowup")) camPitch = THREE.MathUtils.clamp(camPitch + 1.6 * dt, -1.2, 2.8);
        if (keys.has("s") || keys.has("arrowdown")) camPitch = THREE.MathUtils.clamp(camPitch - 1.6 * dt, -1.2, 2.8);
      } else {
        if (keys.has("w") || keys.has("arrowup")) move += 1;
        if (keys.has("s") || keys.has("arrowdown")) move -= 1;
        if (keys.has("a") || keys.has("arrowleft")) turn += 1;
        if (keys.has("d") || keys.has("arrowright")) turn -= 1;
        move += -joy.y;
        turn += -joy.x;
      }
      move = THREE.MathUtils.clamp(move, -1, 1);
      turn = THREE.MathUtils.clamp(turn, -1, 1);
      if (seated) {
        move = 0;
        turn = 0;
      }

      if (!seated) {
        avatar.rotation.y += turn * TURN_SPEED * dt;
      }
      forward.set(Math.sin(avatar.rotation.y), 0, Math.cos(avatar.rotation.y));

      const running = !seated && Math.abs(move) > 0.05 && keys.has("shift");
      const speed = (running ? RUN_SPEED : WALK_SPEED) * move;

      if (!seated) {
        proposed.copy(avatar.position);
        proposed.x += forward.x * speed * dt;
        proposed.z += forward.z * speed * dt;
        resolveCollisions(proposed);

        // Colisión contra el estadio por geometría real (sin cajas invisibles)
        if (stadiumObject) {
          const mx = proposed.x - avatar.position.x;
          const mz = proposed.z - avatar.position.z;
          const md = Math.hypot(mx, mz);
          if (md > 0.0001) {
            rayDir.set(mx / md, 0, mz / md);
            rayOrigin.set(avatar.position.x, groundY + 1, avatar.position.z);
            raycaster.set(rayOrigin, rayDir);
            raycaster.near = 0;
            raycaster.far = md + AVATAR_RADIUS;
            const hits = raycaster.intersectObject(stadiumObject, true);
            if (hits.length) {
              const p = hits[0].point;
              const isDoor = p.z > DOOR.z && Math.abs(p.x) < DOOR.half;
              if (!isDoor) {
                proposed.x = avatar.position.x;
                proposed.z = avatar.position.z;
              }
            }
          }
        }

        avatar.position.x = proposed.x;
        avatar.position.z = proposed.z;
      }

      // Altura real del suelo: el estadio tiene dureza y no se hunde en los pies
      let targetGround = 0;
      if (stadiumObject) {
        rayOrigin.set(avatar.position.x, 20, avatar.position.z);
        raycaster.set(rayOrigin, DOWN);
        raycaster.near = 0;
        raycaster.far = 40;
        const hits = raycaster.intersectObject(stadiumObject, true);
        if (hits.length) targetGround = hits[0].point.y;
      }
      groundY += (targetGround - groundY) * Math.min(1, dt * 12);

      if (!seated && (Math.abs(move) > 0.05 || Math.abs(turn) > 0.05)) {
        walkPhase += dt * (running ? 14 : 9) * Math.max(Math.abs(move), Math.abs(turn) * 0.6);
        human.setWalk(walkPhase, running ? 1 : 0.62);
        avatar.position.y = groundY + Math.abs(Math.sin(walkPhase)) * (running ? 0.09 : 0.05);
      } else if (!seated) {
        human.setWalk(0, 0);
        avatar.position.y += (groundY - avatar.position.y) * Math.min(1, dt * 8);
      }

      let nearest: Interactable | null = null;
      if (seated) {
        const bench = sitBench;
        if (bench) {
          nearest = interactables.find((it) => it.x === bench.x && it.z === bench.z) ?? null;
        }
      } else {
        let bestDist = Infinity;
        for (const it of interactables) {
          if (it.enabled && !it.enabled()) continue;
          const d = Math.hypot(avatar.position.x - it.x, avatar.position.z - it.z);
          if (d < it.radius && d < bestDist) {
            bestDist = d;
            nearest = it;
          }
        }
      }
      activeInteractableRef.current = nearest;
      const prompt = promptRef.current;
      if (prompt) {
        if (nearest) {
          projected.set(nearest.x, nearest.y, nearest.z).project(camera);
          if (projected.z < 1) {
            const vw = container.clientWidth || 1;
            const vh = container.clientHeight || 1;
            prompt.style.display = "inline-flex";
            prompt.style.left = `${(projected.x * 0.5 + 0.5) * vw}px`;
            prompt.style.top = `${(-projected.y * 0.5 + 0.5) * vh}px`;
            if (promptKeyRef.current) promptKeyRef.current.textContent = nearest.key;
            if (promptLabelRef.current) promptLabelRef.current.textContent = nearest.label();
          } else {
            prompt.style.display = "none";
          }
        } else {
          prompt.style.display = "none";
        }
      }

      offset.set(ball.position.x - avatar.position.x, 0, ball.position.z - avatar.position.z);
      const distance = offset.length();
      if (distance < 0.85 && distance > 0.001) {
        offset.multiplyScalar(1 / distance);
        ballVelocity.addScaledVector(offset, (0.85 - distance) * 16);
      }
      ball.position.addScaledVector(ballVelocity, dt);
      ballVelocity.multiplyScalar(Math.max(0, 1 - dt * 2.2));
      ball.position.x = THREE.MathUtils.clamp(ball.position.x, -32, 32);
      ball.position.z = THREE.MathUtils.clamp(ball.position.z, -40, 40);
      ball.position.y = stadiumTopY + BALL_RADIUS;
      ball.rotation.x += ballVelocity.z * dt * 2;
      ball.rotation.z -= ballVelocity.x * dt * 2;

      if (modeRef.current === "first") {
        desiredCam.set(avatar.position.x + forward.x * FIRST.forward, FIRST.height, avatar.position.z + forward.z * FIRST.forward);
        lookTarget.set(avatar.position.x + forward.x * 6, FIRST.height, avatar.position.z + forward.z * 6);
      } else {
        const camAngle = avatar.rotation.y + camYaw;
        desiredCam.set(
          avatar.position.x - Math.sin(camAngle) * THIRD.distance,
          THIRD.height + camPitch,
          avatar.position.z - Math.cos(camAngle) * THIRD.distance,
        );
        lookTarget.set(avatar.position.x, THIRD.look, avatar.position.z);
      }

      if (!cameraReady) {
        camera.position.copy(desiredCam);
        cameraReady = true;
      } else {
        camera.position.lerp(desiredCam, Math.min(1, dt * 10));
      }
      camera.lookAt(lookTarget);

      // Efecto de agua en las fuentes: chorro que chapotea y se divide en gotitas
      waterTex.offset.x = (waterTex.offset.x + dt * 0.06) % 1;
      waterTex.offset.y = (waterTex.offset.y + dt * 0.04) % 1;
      for (const jet of waterJets) {
        jet.scale.y = 0.8 + Math.sin(elapsed * 6 + jet.position.x + jet.position.z) * 0.25;
      }
      for (const drop of drops) {
        drop.vy -= 9 * dt;
        drop.mesh.position.x += drop.vx * dt;
        drop.mesh.position.y += drop.vy * dt;
        drop.mesh.position.z += drop.vz * dt;
        if (drop.mesh.position.y < 0.55) {
          drop.mesh.position.set(drop.ox, 2.2, drop.oz);
          drop.vx = (Math.random() - 0.5) * 1.8;
          drop.vy = 3 + Math.random() * 1.8;
          drop.vz = (Math.random() - 0.5) * 1.8;
        }
      }
      // Palomas: volando en círculos o picoteando en el parque
      for (const p of pigeons) {
        if (p.mode === "fly") {
          p.angle += p.speed * dt;
          p.group.position.set(
            p.cx + Math.cos(p.angle) * p.radius,
            3.2 + Math.sin(elapsed * 2 + p.phase) * 0.7,
            p.cz + Math.sin(p.angle) * p.radius,
          );
          p.group.rotation.y = -p.angle + Math.PI / 2;
          const flap = Math.sin(elapsed * 16 + p.phase) * 0.7;
          p.wings[0].rotation.z = flap;
          p.wings[1].rotation.z = -flap;
        } else {
          p.head.rotation.x = Math.max(0, Math.sin(elapsed * 6 + p.phase)) * 0.9;
          p.group.position.y = 0.16 + (Math.sin(elapsed * 1.3 + p.phase) > 0.92 ? 0.12 : 0);
          p.wings[0].rotation.z = 0;
          p.wings[1].rotation.z = 0;
        }
      }

      // Grada: saltos, celebración y apoyo
      animateCrowd(crowdFans, elapsed);

      // Jugadores en línea: interpolación hacia su última posición conocida.
      for (const player of remotePlayers.values()) {
        const object = player.human.object3D;
        const dx = player.target.x - object.position.x;
        const dz = player.target.z - object.position.z;
        const distance = Math.hypot(dx, dz);
        object.position.x += dx * Math.min(1, dt * 9);
        object.position.z += dz * Math.min(1, dt * 9);
        object.position.y =
          Math.abs(object.position.x) < 46 && Math.abs(object.position.z) < 46 ? stadiumTopY : 0;
        let rotDelta = player.rotTarget - object.rotation.y;
        rotDelta = Math.atan2(Math.sin(rotDelta), Math.cos(rotDelta));
        object.rotation.y += rotDelta * Math.min(1, dt * 9);
        if (distance > 0.06) {
          player.phase += dt * 9;
          player.human.setWalk(player.phase, 0.62);
        } else {
          player.human.setWalk(0, 0);
        }
      }

      // Selección por hover: círculo en el suelo bajo el jugador señalado.
      if (!menuOpenRef.current) updateHover();

      // Envía la posición propia al servidor (limitado a ~10 Hz).
      if (room) {
        moveSendTimer += dt;
        if (moveSendTimer >= 0.1) {
          moveSendTimer = 0;
          room.send("avatar:move", { x: avatar.position.x, z: avatar.position.z, rot: avatar.rotation.y });
        }
      }

      // NPC: balanceo suave de espera
      npc.position.y = Math.abs(Math.sin(elapsed * 1.6)) * 0.04;
      npc.rotation.y = Math.PI + Math.sin(elapsed * 0.8) * 0.1;

      // Flecha de la lección sobre el profesor
      if (lessonArrow.visible) {
        lessonArrow.position.set(teacher.position.x, 0, teacher.position.z);
        arrowCone.position.y = 3.4 + Math.sin(elapsed * 3) * 0.18;
        arrowCone.rotation.y += dt * 1.5;
      }

      // El profesor felicita al cerrar la lección (salta + globo de texto) y luego desaparece
      if (celebrateUntil > 0) {
        if (performance.now() < celebrateUntil) {
          teacher.position.y = Math.abs(Math.sin(elapsed * 9)) * 0.4;
          const bubble = congratsRef.current;
          if (bubble) {
            bubbleVec.set(teacher.position.x, 2.8, teacher.position.z).project(camera);
            const vw = container.clientWidth || 1;
            const vh = container.clientHeight || 1;
            bubble.style.left = `${(bubbleVec.x * 0.5 + 0.5) * vw}px`;
            bubble.style.top = `${(-bubbleVec.y * 0.5 + 0.5) * vh}px`;
          }
        } else {
          celebrateUntil = 0;
          teacher.position.y = 0;
          teacher.visible = false;
          lessonArrow.visible = false;
          if (congratsRef.current) congratsRef.current.style.display = "none";
        }
      }

      // Minimapa: límites del mundo, calles, estadio y posición del avatar
      const mini = miniRef.current;
      if (mini) {
        const mctx = mini.getContext("2d");
        if (mctx) {
          const S = mini.width;
          const pad = 10;
          const span = WORLD_HALF * 2;
          const inner = S - pad * 2;
          const toX = (x: number) => pad + ((x + WORLD_HALF) / span) * inner;
          const toY = (z: number) => pad + ((z + WORLD_HALF) / span) * inner;
          mctx.clearRect(0, 0, S, S);
          mctx.strokeStyle = "rgba(255,255,255,0.16)";
          mctx.lineWidth = 1;
          for (const road of [-SPACING / 2, SPACING / 2]) {
            mctx.beginPath();
            mctx.moveTo(toX(road), pad);
            mctx.lineTo(toX(road), S - pad);
            mctx.stroke();
            mctx.beginPath();
            mctx.moveTo(pad, toY(road));
            mctx.lineTo(S - pad, toY(road));
            mctx.stroke();
          }
          mctx.fillStyle = "rgba(63,155,69,0.55)";
          const cw = (CENTER_BLOCK / span) * inner;
          mctx.fillRect(toX(-CENTER_BLOCK / 2), toY(-CENTER_BLOCK / 2), cw, cw);
          const ax = toX(avatar.position.x);
          const ay = toY(avatar.position.z);
          mctx.strokeStyle = "#c6f232";
          mctx.lineWidth = 1.6;
          mctx.beginPath();
          mctx.moveTo(ax, ay);
          mctx.lineTo(ax + forward.x * 9, ay + forward.z * 9);
          mctx.stroke();
          mctx.fillStyle = "#c6f232";
          mctx.beginPath();
          mctx.arc(ax, ay, 3.4, 0, Math.PI * 2);
          mctx.fill();
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timeTimer);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("goal50:start-lesson", onStartLesson);
      window.removeEventListener("goal50:lesson-complete", onLessonComplete);
      window.removeEventListener("goal50:close-lesson", onCloseLesson);
      joyBase?.removeEventListener("pointerdown", onJoyDown);
      joyBase?.removeEventListener("pointermove", onJoyMove);
      joyBase?.removeEventListener("pointerup", onJoyUp);
      joyBase?.removeEventListener("pointercancel", onJoyUp);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("click", onClick);
      cancelled = true;
      room?.leave();
      room = null;
      for (const player of remotePlayers.values()) {
        scene.remove(player.human.object3D);
        player.human.dispose();
      }
      remotePlayers.clear();
      for (const texture of adTexturesBySlot.values()) texture.dispose();
      human.dispose();
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
  }, [isClient, config, self, toggleMode]);

  if (!isClient) return null;

  return createPortal(
    <div ref={containerRef} className="fixed inset-0 z-[100] overflow-hidden bg-[#9fb6cc]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <canvas
        ref={miniRef}
        width={150}
        height={150}
        className="g50-panel absolute right-4 top-16 hidden rounded-2xl md:block"
      />

      <button
        ref={promptRef}
        type="button"
        onClick={() => activeInteractableRef.current?.action()}
        className="g50-panel absolute z-10 -translate-x-1/2 -translate-y-full items-center gap-2 rounded-full px-3 py-1.5 shadow-lg transition active:scale-95"
        style={{ display: "none" }}
      >
        <span
          ref={promptKeyRef}
          className="flex size-6 items-center justify-center rounded-md border border-white/40 bg-white/15 text-[11px] font-bold"
        >
          E
        </span>
        <span ref={promptLabelRef} className="text-[12px] font-semibold">
          Entrar al hotel
        </span>
      </button>

      <div
        ref={congratsRef}
        className="g50-bubble"
        style={{ display: "none" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">El profesor</p>
        <p className="text-[13px] font-semibold">¡Felicidades, crack! 🎉</p>
      </div>

      <div
        ref={joyBaseRef}
        className="absolute bottom-8 left-6 h-32 w-32 touch-none rounded-full border border-white/30 bg-white/10 backdrop-blur-sm md:hidden"
      >
        <span
          ref={joyKnobRef}
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-white/40 bg-white/70"
        />
      </div>

      {menu ? (
        <PlayerContextMenu
          player={menu.player}
          x={menu.x}
          y={menu.y}
          onClose={() => {
            menuOpenRef.current = false;
            setMenu(null);
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
}
