"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LowpolyHuman } from "@/lib/avatar3d/lowpoly-human";
import {
  ACCESSORIES,
  AVATAR_GENDERS,
  EYE_STYLES,
  GARMENT_PATTERNS,
  HAIR_COLORS,
  HAIR_STYLES,
  HOODIE_NONE,
  KIT_COLORS,
  MOUTH_STYLES,
  SHIELDS,
  SKIN_TONES,
  type AvatarConfig,
} from "@/lib/avatar";

type TabId = "gender" | "hair" | "skin" | "eyes" | "kit" | "details";
type LobbyStatus = "connecting" | "online" | "offline";

type LobbyState = { avatarsJson?: string; count?: number };

type LobbyRoom = {
  sessionId: string;
  send: (type: string, message?: unknown) => void;
  leave: (consented?: boolean) => void;
  onStateChange: (cb: (state: LobbyState) => void) => void;
  onLeave: (cb: (code: number) => void) => void;
  onError: (cb: (code: number, message?: string) => void) => void;
};

const COLYSEUS_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";
const DEFAULT_ROOM = "players_lobby";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "gender", label: "Género" },
  { id: "hair", label: "Pelo" },
  { id: "skin", label: "Piel" },
  { id: "eyes", label: "Ojos" },
  { id: "kit", label: "Uniforme" },
  { id: "details", label: "Detalles" },
];

function Swatch({
  color,
  active,
  onSelect,
}: {
  color: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Color ${color}`}
      className={`av3d-swatch ${active ? "is-active" : ""}`}
      style={{ backgroundColor: color }}
      onClick={onSelect}
    />
  );
}

function PatternChips({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="av3d__row">
      {GARMENT_PATTERNS.map((pattern) => (
        <button
          key={pattern.id}
          type="button"
          className={`av3d-chip ${active === pattern.id ? "is-active" : ""}`}
          onClick={() => onSelect(pattern.id)}
        >
          {pattern.label}
        </button>
      ))}
    </div>
  );
}

export function AvatarCreator3D({
  value,
  onChange,
  name,
  roomName,
}: {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
  name?: string;
  roomName?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localHumanRef = useRef<LowpolyHuman | null>(null);
  const roomRef = useRef<LobbyRoom | null>(null);
  const sessionIdRef = useRef("");
  const valueRef = useRef(value);
  const nameRef = useRef(name ?? "Crack");
  const roomNameRef = useRef(roomName ?? DEFAULT_ROOM);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const spinRef = useRef(-0.5);

  const [tab, setTab] = useState<TabId>("gender");
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const [count, setCount] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
    camera.position.set(0, 1.15, 3.5);
    camera.lookAt(0, 1.02, 0);

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

    const grass = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9, metalness: 0 }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.01;
    grass.receiveShadow = true;
    scene.add(grass);

    const centerCircle = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.58, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.02;
    scene.add(centerCircle);

    const midLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 7.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    midLine.rotation.x = -Math.PI / 2;
    midLine.position.set(0, 0.015, -0.4);
    scene.add(midLine);

    const localPivot = new THREE.Group();
    scene.add(localPivot);

    const local = new LowpolyHuman({ config: valueRef.current, height: 2 });
    localHumanRef.current = local;
    localPivot.add(local.object3D);

    const resize = () => {
      const w = stage.clientWidth || 320;
      const h = stage.clientHeight || 240;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    const onDown = (event: PointerEvent) => {
      draggingRef.current = true;
      lastPointerXRef.current = event.clientX;
      stage.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = event.clientX - lastPointerXRef.current;
      lastPointerXRef.current = event.clientX;
      spinRef.current += dx * 0.012;
    };
    const onUp = (event: PointerEvent) => {
      draggingRef.current = false;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);

    const reconcile = (json: string) => {
      let size = 0;
      try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) size = parsed.length;
      } catch {
        size = 0;
      }
      setCount(size || 1);
    };

    let cancelled = false;
    let room: LobbyRoom | null = null;

    (async () => {
      try {
        const sdk = await import("@colyseus/sdk");
        if (cancelled) return;
        const client = new sdk.Client(COLYSEUS_URL);
        const joined = (await client.joinOrCreate(roomNameRef.current, {
          name: nameRef.current,
          avatar: JSON.stringify(valueRef.current),
        })) as unknown as LobbyRoom;
        if (cancelled) {
          joined.leave();
          return;
        }
        room = joined;
        roomRef.current = joined;
        sessionIdRef.current = joined.sessionId;
        setStatus("online");
        joined.onStateChange((state) => reconcile(String(state?.avatarsJson ?? "[]")));
        joined.onLeave(() => setStatus("offline"));
        joined.onError(() => setStatus("offline"));
      } catch {
        if (!cancelled) setStatus("offline");
      }
    })();

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      clock.getDelta();
      localPivot.rotation.y = spinRef.current;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      room?.leave();
      roomRef.current = null;
      local.dispose();
      localHumanRef.current = null;
      renderer.dispose();
      canvas.width = 0;
    };
  }, []);

  useEffect(() => {
    valueRef.current = value;
    localHumanRef.current?.setConfig(value);

    const room = roomRef.current;
    if (!room) return;
    if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    sendTimerRef.current = setTimeout(() => {
      room.send("avatar:update", JSON.stringify(value));
    }, 120);
    return () => {
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    };
  }, [value]);

  const update = (patch: Partial<AvatarConfig>) => onChange({ ...value, ...patch });

  const statusLabel =
    status === "online"
      ? `Lobby · ${count}`
      : status === "connecting"
        ? "Conectando"
        : "Modo local";

  return (
    <div className="av3d">
      <div className="av3d__stage" ref={stageRef}>
        <canvas ref={canvasRef} className="av3d__canvas" />
        <span className={`av3d__badge ${status === "online" ? "is-online" : ""}`}>
          <i aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <div className="av3d__side">
      <div className="av3d__tabs" role="tablist" aria-label="Personalización del avatar">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`av3d-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="av3d__panels">
      {tab === "gender" && (
        <div className="av3d-gender">
          {AVATAR_GENDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={value.gender === option.id ? "is-active" : ""}
              onClick={() => update({ gender: option.id })}
            >
              <span className="av3d-gender__icon" aria-hidden="true">
                {option.id === "male" ? "🧑" : "👩"}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}

      {tab === "hair" && (
        <div className="av3d__panel">
          <span className="av3d__label">Peinado</span>
          <div className="av3d__row">
            {HAIR_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`av3d-chip ${value.hair === style.id ? "is-active" : ""}`}
                onClick={() => update({ hair: style.id })}
              >
                {style.label}
              </button>
            ))}
          </div>
          <span className="av3d__label">Color de pelo</span>
          <div className="av3d__row">
            {HAIR_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                active={value.hairColor === color}
                onSelect={() => update({ hairColor: color })}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "skin" && (
        <div className="av3d__panel">
          <span className="av3d__label">Tono de piel</span>
          <div className="av3d__row">
            {SKIN_TONES.map((color) => (
              <Swatch
                key={color}
                color={color}
                active={value.skin === color}
                onSelect={() => update({ skin: color })}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "eyes" && (
        <div className="av3d__panel">
          <span className="av3d__label">Ojos</span>
          <div className="av3d__row">
            {EYE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`av3d-chip ${value.eyes === style.id ? "is-active" : ""}`}
                onClick={() => update({ eyes: style.id })}
              >
                {style.label}
              </button>
            ))}
          </div>
          <span className="av3d__label">Boca</span>
          <div className="av3d__row">
            {MOUTH_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`av3d-chip ${value.mouth === style.id ? "is-active" : ""}`}
                onClick={() => update({ mouth: style.id })}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "kit" && (
        <div className="av3d__panel">
          <span className="av3d__label">Camisa</span>
          <div className="av3d__row">
            {KIT_COLORS.map((color) => (
              <Swatch
                key={`jersey-${color}`}
                color={color}
                active={value.jersey === color}
                onSelect={() => update({ jersey: color })}
              />
            ))}
          </div>
          <PatternChips
            active={value.jerseyPattern}
            onSelect={(id) => update({ jerseyPattern: id })}
          />

          <span className="av3d__label">Sudadera</span>
          <div className="av3d__row">
            <button
              type="button"
              className={`av3d-chip ${value.hoodie === HOODIE_NONE ? "is-active" : ""}`}
              onClick={() => update({ hoodie: HOODIE_NONE })}
            >
              Sin sudadera
            </button>
            {KIT_COLORS.map((color) => (
              <Swatch
                key={`hoodie-${color}`}
                color={color}
                active={value.hoodie === color}
                onSelect={() => update({ hoodie: color })}
              />
            ))}
          </div>
          <PatternChips
            active={value.hoodiePattern}
            onSelect={(id) => update({ hoodiePattern: id })}
          />

          <span className="av3d__label">Pantalón</span>
          <div className="av3d__row">
            {KIT_COLORS.map((color) => (
              <Swatch
                key={`shorts-${color}`}
                color={color}
                active={value.shorts === color}
                onSelect={() => update({ shorts: color })}
              />
            ))}
          </div>
          <PatternChips
            active={value.shortsPattern}
            onSelect={(id) => update({ shortsPattern: id })}
          />

          <span className="av3d__label">Tacos</span>
          <div className="av3d__row">
            {KIT_COLORS.map((color) => (
              <Swatch
                key={`boots-${color}`}
                color={color}
                active={value.boots === color}
                onSelect={() => update({ boots: color })}
              />
            ))}
          </div>

          <span className="av3d__label">Número</span>
          <div className="av3d__row av3d__row--number">
            <input
              type="number"
              min={1}
              max={99}
              value={value.number}
              className="av3d-number"
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isInteger(next) && next >= 1 && next <= 99) {
                  update({ number: next });
                }
              }}
            />
            <button
              type="button"
              className={`av3d-chip ${value.numberBack ? "is-active" : ""}`}
              onClick={() => update({ numberBack: !value.numberBack })}
            >
              {value.numberBack ? "✓ " : ""}Número en la espalda
            </button>
          </div>
        </div>
      )}

      {tab === "details" && (
        <div className="av3d__panel">
          <span className="av3d__label">Cabeza</span>
          <div className="av3d__row">
            {ACCESSORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`av3d-chip ${value.accessory === item.id ? "is-active" : ""}`}
                onClick={() => update({ accessory: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="av3d__label">Escudo en la camiseta</span>
          <div className="av3d__row">
            {SHIELDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`av3d-chip ${value.shield === item.id ? "is-active" : ""}`}
                onClick={() =>
                  update({
                    shield: item.id,
                    shieldUrl: item.id === "custom" ? value.shieldUrl : value.shieldUrl,
                  })
                }
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
          {value.shieldUrl ? (
            <span className="av3d__note">El logo del equipo se muestra en la camiseta.</span>
          ) : null}
        </div>
      )}

      <p className="av3d__note">Arrastra para girar · tu avatar se sincroniza con el lobby</p>
      </div>
      </div>
    </div>
  );
}
