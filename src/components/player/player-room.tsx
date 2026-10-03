"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { LowpolyHuman } from "@/lib/avatar3d/lowpoly-human";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";
import {
  FURNITURE_CATEGORIES,
  WINDOW_VIEWS,
  furnitureByCategory,
  furnitureDef,
  roomSizeByKey,
  type FurnitureDef,
  type FurnitureItem,
  type RoomData,
} from "@/lib/room";
import { consumeSleepRequest, getEnergy, setEnergy, useEnergy } from "@/lib/energy";
import { NEED_META, getNeed, setNeed, useNeeds, type NeedKey } from "@/lib/needs";

const WALK_SPEED = 3.4;
const RUN_SPEED = 5.4;
const TURN_SPEED = 2.6;
const AVATAR_RADIUS = 0.4;
const THIRD = { distance: 3.2, height: 2.2, look: 1.1 };
const FIRST = { height: 1.62, forward: 0.4 };
const DOOR_RADIUS = 2.4;
const BED_RADIUS = 3;
const MOVE_STEP = 0.6;
const ROT_STEP = Math.PI / 6;

const subscribe = () => () => {};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function newId() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `f-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 205) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildPoster(def: FurnitureDef): THREE.Group {
  const g = new THREE.Group();
  const w = def.size;
  const h = def.size * 0.8;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 }),
  );
  g.add(frame);
  const texture = makeCanvasTexture((ctx, cw, ch) => {
    ctx.fillStyle = def.color ?? "#334155";
    ctx.fillRect(0, 0, cw, ch);
    ctx.font = "110px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.emoji, cw / 2, ch / 2 + 6);
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  face.position.z = 0.03;
  g.add(face);
  return g;
}

function buildWindow(def: FurnitureDef, viewKey: string): THREE.Group {
  const g = new THREE.Group();
  const w = def.size;
  const h = def.size * 0.75;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x6b7280 }),
  );
  g.add(frame);
  const view = WINDOW_VIEWS.find((v) => v.key === viewKey) ?? WINDOW_VIEWS[0];
  const texture = makeCanvasTexture((ctx, cw, ch) => {
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, view.sky);
    grad.addColorStop(1, "#dfe9f3");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
    if (view.key === "city_night" || view.key === "space") {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 50; i += 1) ctx.fillRect(Math.random() * cw, Math.random() * (ch * 0.6), 1.6, 1.6);
    }
    ctx.fillStyle = view.ground;
    ctx.fillRect(0, ch * 0.72, cw, ch * 0.28);
    ctx.fillStyle = view.key === "city_night" || view.key === "space" ? "#e8eefc" : "#ffe08a";
    ctx.beginPath();
    ctx.arc(cw * 0.78, ch * 0.24, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0);
    ctx.lineTo(cw / 2, ch);
    ctx.moveTo(0, ch / 2);
    ctx.lineTo(cw, ch / 2);
    ctx.stroke();
  }, 256, 192);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture }));
  glass.position.z = 0.07;
  g.add(glass);
  return g;
}

/* ---------- Plantillas FBX (con caché por modelo y por variante) ---------- */

const rawCache = new Map<string, THREE.Group>();
const rawLoading = new Map<string, Promise<THREE.Group>>();
const templateCache = new Map<string, THREE.Group>();
const templateLoading = new Set<string>();

function loadRaw(path: string): Promise<THREE.Group> {
  const cached = rawCache.get(path);
  if (cached) return Promise.resolve(cached);
  const pending = rawLoading.get(path);
  if (pending) return pending;
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    new FBXLoader().load(
      path,
      (fbx) => {
        rawCache.set(path, fbx);
        rawLoading.delete(path);
        resolve(fbx);
      },
      undefined,
      (error) => {
        rawLoading.delete(path);
        reject(error);
      },
    );
  });
  rawLoading.set(path, promise);
  return promise;
}

function needsTemplate(def: FurnitureDef) {
  return def.model.startsWith("/");
}

function buildSink(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.6 }));
  base.position.y = 0.4;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
  bowl.position.set(0, 0.84, 0.05);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.6, roughness: 0.3 }));
  tap.position.set(0, 0.98, -0.12);
  g.add(base, bowl, tap);
  return g;
}

function buildBathtub(): THREE.Group {
  const g = new THREE.Group();
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }));
  tub.position.y = 0.3;
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.62), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.8, roughness: 0.2 }));
  water.position.y = 0.5;
  g.add(tub, water);
  return g;
}

function buildToilet(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.55), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  base.position.y = 0.2;
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }));
  seat.position.set(0, 0.44, 0.08);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.18), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  tank.position.set(0, 0.55, -0.28);
  g.add(base, seat, tank);
  return g;
}

function buildFridge(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.7), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.3, roughness: 0.4 }));
  body.position.y = 0.9;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
  handle.position.set(0.32, 1.1, 0.36);
  g.add(body, handle);
  return g;
}

function buildWaterCooler(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.6 }));
  base.position.y = 0.25;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.85, roughness: 0.3 }));
  body.position.y = 1.0;
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
  tap.position.set(0, 0.6, 0.22);
  g.add(base, body, tap);
  return g;
}

const NEED_OBJECTS: Record<string, { key: NeedKey; label: string }> = {
  sink: { key: "oral", label: "Lavarse los dientes" },
  bathtub: { key: "hygiene", label: "Bañarse" },
  toilet: { key: "bladder", label: "Usar el baño" },
  fridge: { key: "hunger", label: "Comer" },
  water: { key: "thirst", label: "Beber agua" },
};

const NEED_ACTION: Record<NeedKey, "brush" | "drink" | "eat" | "shower" | "toilet"> = {
  oral: "brush",
  hygiene: "shower",
  bladder: "toilet",
  hunger: "eat",
  thirst: "drink",
};

function loadTemplate(def: FurnitureDef, onReady: () => void) {
  if (templateCache.has(def.id) || templateLoading.has(def.id)) return;
  templateLoading.add(def.id);
  loadRaw(def.model)
    .then((raw) => {
      const fbx = raw.clone(true);
      const bounds = new THREE.Box3().setFromObject(fbx);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = def.size / Math.max(size.x, size.z, 0.001);
      fbx.scale.setScalar(scale);
      fbx.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      fbx.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (def.tint !== undefined) {
          const source = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
          const apply = (mat: THREE.MeshStandardMaterial) => {
            const clone = mat.clone();
            clone.color?.set(def.tint as number);
            return clone;
          };
          mesh.material = Array.isArray(source) ? source.map(apply) : apply(source);
        }
      });
      const wrap = new THREE.Group();
      wrap.add(fbx);
      templateCache.set(def.id, wrap);
      templateLoading.delete(def.id);
      onReady();
    })
    .catch(() => {
      templateLoading.delete(def.id);
    });
}

function buildFurniture(item: FurnitureItem): THREE.Group | null {
  const def = furnitureDef(item.type);
  const wrap = new THREE.Group();
  wrap.userData.itemId = item.id;
  let content: THREE.Object3D | null = null;
  if (def.model === "poster") {
    content = buildPoster(def);
  } else if (def.model === "window") {
    content = buildWindow(def, item.view ?? def.view ?? "city_day");
  } else if (def.model === "sink") {
    content = buildSink();
  } else if (def.model === "bathtub") {
    content = buildBathtub();
  } else if (def.model === "toilet") {
    content = buildToilet();
  } else if (def.model === "fridge") {
    content = buildFridge();
  } else if (def.model === "water") {
    content = buildWaterCooler();
  } else {
    const template = templateCache.get(def.id);
    if (!template) return null;
    content = template.clone(true);
  }
  wrap.add(content);
  wrap.position.set(item.x, item.y ?? 0, item.z);
  wrap.rotation.y = item.rotY;
  return wrap;
}

export function PlayerRoom({ config, room }: { config: AvatarConfig | null; room: RoomData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyKnobRef = useRef<HTMLSpanElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const bedPromptRef = useRef<HTMLButtonElement>(null);
  const furnitureGroupRef = useRef<THREE.Group | null>(null);
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const avatarObjRef = useRef<THREE.Object3D | null>(null);
  const editModeRef = useRef(false);
  const sleepingRef = useRef(false);
  const sleepRef = useRef<() => void>(() => {});
  const sleepCleanupRef = useRef<() => void>(() => {});
  const itemsRef = useRef<FurnitureItem[]>(room.furniture);
  const exitRef = useRef<() => void>(() => {});
  const modeRef = useRef<"third" | "first">("third");
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  const size = roomSizeByKey(room.size);
  const halfW = size.width / 2;
  const halfD = size.depth / 2;

  const [items, setItems] = useState<FurnitureItem[]>(room.furniture);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [category, setCategory] = useState(FURNITURE_CATEGORIES[0].key);
  const [editMode, setEditMode] = useState(false);
  const [templatesTick, setTemplatesTick] = useState(0);
  const [sleeping, setSleeping] = useState(false);
  const [using, setUsing] = useState<{ key: NeedKey; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const furnitureCollidersRef = useRef<{ x: number; z: number; r: number }[]>([]);
  const wakeRef = useRef<() => void>(() => {});
  const usingRef = useRef(false);
  const usingActionRef = useRef<"brush" | "drink" | "eat" | "shower" | "toilet" | null>(null);
  const stopUsingRef = useRef<() => void>(() => {});
  const useObjectRef = useRef<(key: NeedKey, label: string, x: number, z: number) => void>(() => {});
  const activeNeedRef = useRef<{ key: NeedKey; label: string; x: number; z: number } | null>(null);
  const needPromptRef = useRef<HTMLButtonElement>(null);
  const energy = useEnergy();
  const needs = useNeeds();

  const saveState = useCallback(
    (data: { avatarX?: number; avatarZ?: number; avatarRot?: number; furniture?: FurnitureItem[] }) => {
      void fetch("/api/room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: room.id, ...data }),
      }).catch(() => {
        /* se reintenta luego */
      });
    },
    [room.id],
  );

  const commit = useCallback(
    (next: FurnitureItem[]) => {
      setItems(next);
      saveState({ furniture: next });
    },
    [saveState],
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  const toggleMode = useCallback(() => {
    modeRef.current = modeRef.current === "third" ? "first" : "third";
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const a = avatarObjRef.current;
      if (a) saveState({ avatarX: a.position.x, avatarZ: a.position.z, avatarRot: a.rotation.y });
    }, 6000);
    return () => clearInterval(id);
  }, [saveState]);

  // Escena de la habitación
  useEffect(() => {
    if (!isClient) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 1.1));
    const key = new THREE.DirectionalLight(0xfff4e0, 1.5);
    key.position.set(5, 9, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const lamp = new THREE.PointLight(0xffe6b0, 14, 22);
    lamp.position.set(0, size.height - 0.5, 0);
    scene.add(lamp);

    const wallH = size.height;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(size.width, size.depth),
      new THREE.MeshStandardMaterial({ color: room.floorColor, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(size.width, size.depth),
      new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 1 }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallH;
    scene.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ color: room.wallColor, roughness: 0.95, side: THREE.DoubleSide });
    const makeWall = (w: number) => new THREE.Mesh(new THREE.PlaneGeometry(w, wallH), wallMat);
    const back = makeWall(size.width);
    back.position.set(0, wallH / 2, -halfD);
    const front = makeWall(size.width);
    front.rotation.y = Math.PI;
    front.position.set(0, wallH / 2, halfD);
    const left = makeWall(size.depth);
    left.rotation.y = Math.PI / 2;
    left.position.set(-halfW, wallH / 2, 0);
    const right = makeWall(size.depth);
    right.rotation.y = -Math.PI / 2;
    right.position.set(halfW, wallH / 2, 0);
    scene.add(back, front, left, right);
    const walls = [back, front, left, right];

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5a3b22, roughness: 0.8 }),
    );
    door.position.set(0, 1.15, halfD - 0.07);
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 2.5, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.9 }),
    );
    doorFrame.position.set(0, 1.25, halfD - 0.02);
    scene.add(door, doorFrame);

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);
    furnitureGroupRef.current = furnitureGroup;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.85, 36),
      new THREE.MeshBasicMaterial({ color: 0xc6f232, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    scene.add(ring);
    selectionRingRef.current = ring;

    const human = new LowpolyHuman({ config: config ?? DEFAULT_AVATAR_CONFIG, height: 1.8 });
    const hasSaved = room.avatarX !== 0 || room.avatarZ !== 0 || room.avatarRot !== 0;
    human.object3D.position.set(room.avatarX, 0, hasSaved ? room.avatarZ : halfD - 1.6);
    human.object3D.rotation.y = hasSaved ? room.avatarRot : Math.PI;
    scene.add(human.object3D);
    avatarObjRef.current = human.object3D;

    const exitRoom = () => {
      const a = human.object3D;
      saveState({ avatarX: a.position.x, avatarZ: a.position.z, avatarRot: a.rotation.y });
      window.dispatchEvent(new CustomEvent("goal50:exit-room"));
    };
    exitRef.current = exitRoom;

    let sleepInterval = 0;
    let toastTimer = 0;
    const showToast = (message: string) => {
      setToast(message);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setToast(null), 2600);
    };

    const wake = () => {
      if (!sleepingRef.current) return;
      sleepingRef.current = false;
      setSleeping(false);
      if (sleepInterval) {
        clearInterval(sleepInterval);
        sleepInterval = 0;
      }
      const bed = itemsRef.current.find((item) => item.type.startsWith("bed_"));
      const a = human.object3D;
      a.position.y = 0;
      if (bed) a.position.set(bed.x + 1.4, 0, bed.z);
      human.setWalk(0, 0);
    };

    const sleep = () => {
      if (sleepingRef.current) return;
      if (getEnergy() >= 100) {
        showToast("Tu energía ya está al 100%");
        return;
      }
      sleepingRef.current = true;
      setSleeping(true);
      const bed = itemsRef.current.find((item) => item.type.startsWith("bed_"));
      const a = human.object3D;
      if (bed) {
        a.position.set(bed.x, 0, bed.z + 1.0);
        a.rotation.y = bed.rotY;
      }
      sleepInterval = window.setInterval(() => {
        const next = Math.min(100, Math.round((getEnergy() + 0.1) * 10) / 10);
        setEnergy(next);
        if (next >= 100) wake();
      }, 3000);
    };
    sleepRef.current = sleep;
    wakeRef.current = wake;
    sleepCleanupRef.current = () => {
      if (sleepInterval) clearInterval(sleepInterval);
      if (toastTimer) clearTimeout(toastTimer);
    };

    let useInterval = 0;
    const stopUsing = () => {
      if (!usingRef.current) return;
      usingRef.current = false;
      usingActionRef.current = null;
      setUsing(null);
      if (useInterval) {
        clearInterval(useInterval);
        useInterval = 0;
      }
    };
    const useObject = (key: NeedKey, label: string, x: number, z: number) => {
      if (usingRef.current) return;
      usingRef.current = true;
      usingActionRef.current = NEED_ACTION[key];
      setUsing({ key, label });
      const a = human.object3D;
      const dx = -x;
      const dz = -z;
      const d = Math.hypot(dx, dz) || 1;
      a.position.set(x + (dx / d) * 1.3, 0, z + (dz / d) * 1.3);
      a.rotation.y = Math.atan2(x - a.position.x, z - a.position.z);
      useInterval = window.setInterval(() => {
        const next = Math.min(100, Math.round((getNeed(key) + 0.1) * 10) / 10);
        setNeed(key, next);
        if (next >= 100) stopUsing();
      }, 3000);
    };
    stopUsingRef.current = stopUsing;
    useObjectRef.current = useObject;

    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const k = event.key.toLowerCase();
      if (k === "v") {
        toggleMode();
        return;
      }
      if (k === "e") {
        if (usingRef.current) stopUsingRef.current();
        else if (sleepingRef.current) wake();
        else if (activeNeedRef.current) useObjectRef.current(activeNeedRef.current.key, activeNeedRef.current.label, activeNeedRef.current.x, activeNeedRef.current.z);
        else if (nearBed) sleep();
        else if (nearDoor) exitRoom();
        return;
      }
      keys.add(k);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onSleepEvent = () => sleep();
    window.addEventListener("goal50:sleep", onSleepEvent);

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

    // Selección + arrastrar y soltar muebles
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorPoint = new THREE.Vector3();
    let drag: { id: string; mesh: THREE.Object3D; offsetX: number; offsetZ: number } | null = null;

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!editModeRef.current) return;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(furnitureGroup.children, true);
      if (hits.length === 0) {
        setSelectedId(null);
        return;
      }
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData.itemId) obj = obj.parent;
      if (!obj) return;
      setSelectedId(obj.userData.itemId as string);
      if (raycaster.ray.intersectPlane(dragPlane, floorPoint)) {
        drag = { id: obj.userData.itemId as string, mesh: obj, offsetX: obj.position.x - floorPoint.x, offsetZ: obj.position.z - floorPoint.z };
        canvas.setPointerCapture(event.pointerId);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane, floorPoint)) {
        drag.mesh.position.x = clamp(floorPoint.x + drag.offsetX, -halfW + 0.6, halfW - 0.6);
        drag.mesh.position.z = clamp(floorPoint.z + drag.offsetZ, -halfD + 0.6, halfD - 0.6);
        const r = selectionRingRef.current;
        if (r) r.position.set(drag.mesh.position.x, 0.02, drag.mesh.position.z);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!drag) return;
      const current = drag;
      drag = null;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* no capturado */
      }
      const next = itemsRef.current.map((item) => {
        if (item.id !== current.id) return item;
        const def = furnitureDef(item.type);
        let x = current.mesh.position.x;
        let z = current.mesh.position.z;
        let rotY = item.rotY;
        let y = item.y;
        if (def.kind === "wall") {
          const dFront = halfD - z;
          const dBack = z + halfD;
          const dLeft = x + halfW;
          const dRight = halfW - x;
          const min = Math.min(dFront, dBack, dLeft, dRight);
          if (min === dFront) {
            rotY = Math.PI;
            x = clamp(x, -halfW + def.size / 2, halfW - def.size / 2);
          } else if (min === dBack) {
            rotY = 0;
            x = clamp(x, -halfW + def.size / 2, halfW - def.size / 2);
          } else if (min === dLeft) {
            rotY = Math.PI / 2;
            z = clamp(z, -halfD + def.size / 2, halfD - def.size / 2);
          } else {
            rotY = -Math.PI / 2;
            z = clamp(z, -halfD + def.size / 2, halfD - def.size / 2);
          }
          y = item.y ?? wallH * 0.55;
          // Ajusta con la caja real para que el objeto quede pegado a la pared
          current.mesh.rotation.y = rotY;
          current.mesh.position.set(x, y, z);
          current.mesh.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(current.mesh);
          if (min === dFront) z += halfD - box.max.z;
          else if (min === dBack) z += -halfD - box.min.z;
          else if (min === dLeft) x += -halfW - box.min.x;
          else x += halfW - box.max.x;
          current.mesh.position.set(x, y, z);
        }
        return { ...item, x, z, rotY, y };
      });
      setItems(next);
      saveState({ furniture: next });
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

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
    const camRay = new THREE.Raycaster();
    const camDir = new THREE.Vector3();
    const camOrigin = new THREE.Vector3();
    const clock = new THREE.Clock();
    let walkPhase = 0;
    let camYaw = 0;
    let camPitch = 0;
    let raf = 0;
    let cameraReady = false;
    let nearDoor = false;
    let nearBed = false;
    const innerX = halfW - AVATAR_RADIUS;
    const innerZ = halfD - AVATAR_RADIUS;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      let move = 0;
      let turn = 0;
      const orbiting = keys.has("q") && !sleepingRef.current && !usingRef.current;
      if (orbiting) {
        if (keys.has("a") || keys.has("arrowleft")) camYaw += 1.8 * dt;
        if (keys.has("d") || keys.has("arrowright")) camYaw -= 1.8 * dt;
        if (keys.has("w") || keys.has("arrowup")) camPitch = clamp(camPitch + 1.6 * dt, -1.2, 2.8);
        if (keys.has("s") || keys.has("arrowdown")) camPitch = clamp(camPitch - 1.6 * dt, -1.2, 2.8);
      } else if (!sleepingRef.current && !usingRef.current) {
        if (keys.has("w") || keys.has("arrowup")) move += 1;
        if (keys.has("s") || keys.has("arrowdown")) move -= 1;
        if (keys.has("a") || keys.has("arrowleft")) turn += 1;
        if (keys.has("d") || keys.has("arrowright")) turn -= 1;
        move += -joy.y;
        turn += -joy.x;
      }
      move = clamp(move, -1, 1);
      turn = clamp(turn, -1, 1);

      avatar.rotation.y += turn * TURN_SPEED * dt;
      forward.set(Math.sin(avatar.rotation.y), 0, Math.cos(avatar.rotation.y));

      const running = Math.abs(move) > 0.05 && keys.has("shift");
      const speed = (running ? RUN_SPEED : WALK_SPEED) * move;
      proposed.copy(avatar.position);
      proposed.x += forward.x * speed * dt;
      proposed.z += forward.z * speed * dt;
      if (!sleepingRef.current) {
        for (const c of furnitureCollidersRef.current) {
          const dx = proposed.x - c.x;
          const dz = proposed.z - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + AVATAR_RADIUS;
          if (d < min && d > 0.0001) {
            proposed.x = c.x + (dx / d) * min;
            proposed.z = c.z + (dz / d) * min;
          }
        }
      }
      proposed.x = clamp(proposed.x, -innerX, innerX);
      proposed.z = clamp(proposed.z, -innerZ, innerZ);
      avatar.position.x = proposed.x;
      avatar.position.z = proposed.z;

      if (sleepingRef.current) {
        human.lie(elapsed * 2);
      } else if (usingRef.current) {
        human.perform(usingActionRef.current ?? "brush", elapsed * 6);
      } else if (Math.abs(move) > 0.05 || Math.abs(turn) > 0.05) {
        walkPhase += dt * (running ? 14 : 9) * Math.max(Math.abs(move), Math.abs(turn) * 0.6);
        human.setWalk(walkPhase, running ? 1 : 0.62);
        avatar.position.y = Math.abs(Math.sin(walkPhase)) * (running ? 0.09 : 0.05);
      } else {
        human.setWalk(0, 0);
        avatar.position.y += (0 - avatar.position.y) * Math.min(1, dt * 8);
      }

      nearDoor = Math.hypot(avatar.position.x, avatar.position.z - halfD) < DOOR_RADIUS;
      let nearestBed = Infinity;
      for (const item of itemsRef.current) {
        if (!item.type.startsWith("bed_")) continue;
        const d = Math.hypot(avatar.position.x - item.x, avatar.position.z - item.z);
        if (d < nearestBed) nearestBed = d;
      }
      nearBed = nearestBed < BED_RADIUS;
      if (promptRef.current) promptRef.current.style.display = nearDoor ? "inline-flex" : "none";
      if (bedPromptRef.current) bedPromptRef.current.style.display = nearBed && !nearDoor ? "inline-flex" : "none";

      let nearestNeed: { key: NeedKey; label: string; x: number; z: number; dist: number } | null = null;
      for (const item of itemsRef.current) {
        const meta = NEED_OBJECTS[item.type];
        if (!meta) continue;
        const d = Math.hypot(avatar.position.x - item.x, avatar.position.z - item.z);
        if (d < 2.6 && (!nearestNeed || d < nearestNeed.dist)) {
          nearestNeed = { key: meta.key, label: meta.label, x: item.x, z: item.z, dist: d };
        }
      }
      activeNeedRef.current = nearestNeed
        ? { key: nearestNeed.key, label: nearestNeed.label, x: nearestNeed.x, z: nearestNeed.z }
        : null;
      if (needPromptRef.current) {
        const show = Boolean(nearestNeed) && !nearBed && !nearDoor;
        needPromptRef.current.style.display = show ? "inline-flex" : "none";
        const labelEl = needPromptRef.current.querySelector("[data-need-label]");
        if (labelEl && nearestNeed) labelEl.textContent = nearestNeed.label;
      }

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
        camOrigin.set(avatar.position.x, THIRD.look + 0.5, avatar.position.z);
        camDir.copy(desiredCam).sub(camOrigin);
        const camDist = camDir.length();
        if (camDist > 0.001) {
          camDir.multiplyScalar(1 / camDist);
          camRay.set(camOrigin, camDir);
          camRay.near = 0;
          camRay.far = camDist;
          const hits = camRay.intersectObjects(walls, false);
          if (hits.length > 0) {
            desiredCam.copy(camOrigin).addScaledVector(camDir, Math.max(0.6, hits[0].distance - 0.3));
          }
        }
      }

      if (!cameraReady) {
        camera.position.copy(desiredCam);
        cameraReady = true;
      } else {
        camera.position.lerp(desiredCam, Math.min(1, dt * 10));
      }
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      sleepCleanupRef.current();
      stopUsingRef.current();
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("goal50:sleep", onSleepEvent);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      joyBase?.removeEventListener("pointerdown", onJoyDown);
      joyBase?.removeEventListener("pointermove", onJoyMove);
      joyBase?.removeEventListener("pointerup", onJoyUp);
      joyBase?.removeEventListener("pointercancel", onJoyUp);
      human.dispose();
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        let parent: THREE.Object3D | null = mesh;
        while (parent) {
          if (parent === furnitureGroup) return;
          parent = parent.parent;
        }
        mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      renderer.dispose();
      canvas.width = 0;
      furnitureGroupRef.current = null;
      selectionRingRef.current = null;
      avatarObjRef.current = null;
    };
  }, [isClient, config, room, toggleMode, saveState, size.width, size.depth, size.height, halfW, halfD]);

  // Renderiza/actualiza los muebles
  useEffect(() => {
    if (!isClient) return;
    const group = furnitureGroupRef.current;
    if (!group) return;
    for (const child of [...group.children]) group.remove(child);
    const colliders: { x: number; z: number; r: number }[] = [];
    for (const item of items) {
      const def = furnitureDef(item.type);
      if (def.kind !== "wall" && item.type !== "carpet") {
        colliders.push({ x: item.x, z: item.z, r: def.size * 0.42 });
      }
      if (needsTemplate(def) && !templateCache.has(def.id)) {
        loadTemplate(def, () => setTemplatesTick((t) => t + 1));
        continue;
      }
      const mesh = buildFurniture(item);
      if (mesh) group.add(mesh);
    }
    furnitureCollidersRef.current = colliders;
  }, [items, isClient, templatesTick]);

  // Anillo de selección
  useEffect(() => {
    const ring = selectionRingRef.current;
    if (!ring) return;
    const selected = items.find((item) => item.id === selectedId);
    if (selected) {
      ring.visible = true;
      ring.position.set(selected.x, 0.02, selected.z);
    } else {
      ring.visible = false;
    }
  }, [selectedId, items]);

  // Dormir al montar si quedó pendiente
  useEffect(() => {
    if (!isClient) return;
    if (!consumeSleepRequest()) return;
    const id = setTimeout(() => sleepRef.current(), 800);
    return () => clearTimeout(id);
  }, [isClient]);

  const buy = (def: FurnitureDef) => {
    const avatar = avatarObjRef.current;
    let x = 0;
    let z = 0;
    let y = 0;
    let rotY = 0;
    if (def.kind === "wall") {
      x = halfW * 0.45;
      z = halfD - (def.model === "window" ? 0.06 : 0.03);
      y = size.height * 0.55;
      rotY = Math.PI;
    } else {
      const fwd = new THREE.Vector3(Math.sin(avatar?.rotation.y ?? 0), 0, Math.cos(avatar?.rotation.y ?? 0));
      x = clamp((avatar?.position.x ?? 0) + fwd.x * 2, -halfW + 1, halfW - 1);
      z = clamp((avatar?.position.z ?? 0) + fwd.z * 2, -halfD + 1, halfD - 1);
    }
    const item: FurnitureItem = { id: newId(), type: def.id, x, z, rotY, y };
    commit([...items, item]);
    setSelectedId(item.id);
    setEditMode(true);
    setShopOpen(false);
  };

  const updateSelected = (patch: Partial<FurnitureItem>) => {
    if (!selectedId) return;
    commit(items.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)));
  };

  const moveSelected = (dx: number, dz: number) => {
    const sel = items.find((item) => item.id === selectedId);
    if (!sel) return;
    updateSelected({
      x: clamp(sel.x + dx, -halfW + 0.8, halfW - 0.8),
      z: clamp(sel.z + dz, -halfD + 0.8, halfD - 0.8),
    });
  };

  const rotateSelected = (dir: number) => {
    const sel = items.find((item) => item.id === selectedId);
    if (sel) updateSelected({ rotY: sel.rotY + dir * ROT_STEP });
  };

  const raiseSelected = (delta: number) => {
    const sel = items.find((item) => item.id === selectedId);
    if (!sel) return;
    const def = furnitureDef(sel.type);
    const max = Math.max(0.6, size.height - def.size * 0.4);
    updateSelected({ y: clamp((sel.y ?? size.height * 0.55) + delta, 0.5, max) });
  };

  const removeSelected = () => {
    if (!selectedId) return;
    commit(items.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedDef = selectedItem ? furnitureDef(selectedItem.type) : null;

  if (!isClient) return null;

  return createPortal(
    <div ref={containerRef} className="fixed inset-0 z-[100] overflow-hidden bg-[#0a0c10]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <div className="g50-panel pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 rounded-2xl px-6 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Tu habitación</p>
        <p className="text-lg font-black text-white">{room.name}</p>
      </div>

      <div className="absolute right-4 top-16 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShopOpen((v) => !v)}
          className="g50-panel rounded-full px-4 py-2 text-[12px] font-semibold transition"
        >
          🛒 Tienda
        </button>
        <button
          type="button"
          onClick={() => {
            if (editMode) {
              setEditMode(false);
              setSelectedId(null);
            } else {
              setEditMode(true);
            }
          }}
          className={`rounded-full border px-4 py-2 text-[12px] font-semibold backdrop-blur-md transition ${
            editMode ? "border-lime/60 bg-lime/20 text-white" : "g50-panel"
          }`}
        >
          {editMode ? "✓ Editando" : "✎ Editar"}
        </button>
      </div>

      {/* Tienda por categorías */}
      {shopOpen ? (
        <div className="g50-panel absolute right-4 top-28 flex max-h-[74vh] w-[min(94vw,460px)] overflow-hidden rounded-3xl">
          <div className="flex w-14 flex-col items-center gap-1 border-r border-white/10 py-3">
            {FURNITURE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                title={cat.label}
                className={`flex size-11 items-center justify-center rounded-2xl text-lg transition ${
                  category === cat.key ? "bg-lime/25 ring-1 ring-lime/50" : "hover:bg-white/10"
                }`}
              >
                {cat.emoji}
              </button>
            ))}
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto p-3">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
              {FURNITURE_CATEGORIES.find((c) => c.key === category)?.label} · todo a $0
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {furnitureByCategory(category).map((def) => (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => buy(def)}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-center transition hover:bg-white/15"
                >
                  <span className="text-xl">{def.emoji}</span>
                  <span className="text-[12px] font-semibold text-white">{def.label}</span>
                  <span className="text-[11px] font-bold text-lime">${def.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Controles de edición */}
      {editMode && selectedItem && selectedDef ? (
        <div className="g50-panel absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-3xl px-4 py-3">
          {selectedDef.model === "window" ? (
            <div className="flex items-center gap-1">
              {WINDOW_VIEWS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => updateSelected({ view: view.key })}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    (selectedItem.view ?? selectedDef.view) === view.key
                      ? "border-lime/60 bg-lime/20 text-white"
                      : "border-white/15 bg-white/5 text-white/70 hover:bg-white/15"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 grid-rows-3 gap-1">
              <span />
              <button type="button" onClick={() => moveSelected(0, -MOVE_STEP)} className="edit-btn">▲</button>
              <span />
              <button type="button" onClick={() => moveSelected(-MOVE_STEP, 0)} className="edit-btn">◀</button>
              <span />
              <button type="button" onClick={() => moveSelected(MOVE_STEP, 0)} className="edit-btn">▶</button>
              <span />
              <button type="button" onClick={() => moveSelected(0, MOVE_STEP)} className="edit-btn">▼</button>
              <span />
            </div>
            <span className="h-10 w-px bg-white/20" />
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => rotateSelected(-1)} className="edit-btn">↺</button>
              <button type="button" onClick={() => rotateSelected(1)} className="edit-btn">↻</button>
            </div>
            {selectedDef.kind === "wall" ? (
              <>
                <span className="h-10 w-px bg-white/20" />
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => raiseSelected(0.4)} className="edit-btn" title="Subir">⬆</button>
                  <button type="button" onClick={() => raiseSelected(-0.4)} className="edit-btn" title="Bajar">⬇</button>
                </div>
              </>
            ) : null}
            <span className="h-10 w-px bg-white/20" />
            <button type="button" onClick={removeSelected} className="edit-btn edit-btn--danger">🗑</button>
          </div>
        </div>
      ) : editMode ? (
        <div className="g50-panel pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-semibold">
          Toca y arrastra un mueble para moverlo
        </div>
      ) : null}

      {/* Prompt dormir */}
      <button
        ref={bedPromptRef}
        type="button"
        onClick={() => sleepRef.current()}
        className="g50-panel absolute bottom-36 left-1/2 z-10 -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 shadow-lg transition active:scale-95"
        style={{ display: "none" }}
      >
        <span className="flex size-6 items-center justify-center rounded-md border border-white/40 bg-white/15 text-[11px] font-bold">E</span>
        <span className="text-[12px] font-semibold">Dormir</span>
      </button>

      {/* Prompt de necesidad (lavamanos, bañera, etc.) */}
      <button
        ref={needPromptRef}
        type="button"
        onClick={() => {
          const need = activeNeedRef.current;
          if (need) useObjectRef.current(need.key, need.label, need.x, need.z);
        }}
        className="g50-panel absolute bottom-48 left-1/2 z-10 -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 shadow-lg transition active:scale-95"
        style={{ display: "none" }}
      >
        <span className="flex size-6 items-center justify-center rounded-md border border-white/40 bg-white/15 text-[11px] font-bold">E</span>
        <span data-need-label className="text-[12px] font-semibold">Usar</span>
      </button>

      {/* Prompt salir */}
      <button
        ref={promptRef}
        type="button"
        onClick={() => exitRef.current()}
        className="g50-panel absolute bottom-24 left-1/2 z-10 -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 shadow-lg transition active:scale-95"
        style={{ display: "none" }}
      >
        <span className="flex size-6 items-center justify-center rounded-md border border-white/40 bg-white/15 text-[11px] font-bold">E</span>
        <span className="text-[12px] font-semibold">Salir a la ciudad</span>
      </button>

      {/* Overlay durmiendo */}
      {sleeping ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md">
          <p className="text-4xl">💤</p>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Durmiendo…</p>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${energy}%` }} />
          </div>
          <p className="text-[12px] text-white/60">{energy.toFixed(1)}% · +0.1 cada 3 s</p>
          <button
            type="button"
            onClick={() => wakeRef.current()}
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/20"
          >
            Despertar
          </button>
        </div>
      ) : null}

      {using ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-md">
          <p className="text-4xl">{NEED_META[using.key].emoji}</p>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">{using.label}</p>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${needs[using.key]}%` }} />
          </div>
          <p className="text-[12px] text-white/60">{needs[using.key].toFixed(1)}% · +0.1 cada 3 s</p>
          <button
            type="button"
            onClick={() => stopUsingRef.current()}
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/20"
          >
            Detener
          </button>
        </div>
      ) : null}

      {toast ? (
        <div className="g50-panel pointer-events-none absolute left-1/2 top-28 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-semibold">
          {toast}
        </div>
      ) : null}

      <div
        ref={joyBaseRef}
        className="absolute bottom-8 left-6 h-32 w-32 touch-none rounded-full border border-white/30 bg-white/10 backdrop-blur-sm md:hidden"
      >
        <span
          ref={joyKnobRef}
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-white/40 bg-white/70"
        />
      </div>
    </div>,
    document.body,
  );
}
