"use client";

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import * as THREE from "three";
import { ArrowRight, Palette, Shirt, Sparkles } from "lucide-react";
import { FiguraAvatar } from "@/lib/avatar3d/avatares/figura";
import { cargarManifiesto, type AssetAvatar, type ManifiestoAvatar } from "@/lib/avatar3d/avatares/registro";
import { AssetThumb } from "@/components/login/asset-thumb";
import {
  ACCESSORIES,
  AVATAR_GENDERS,
  EYE_STYLES,
  GARMENT_PATTERNS,
  HAIR_COLORS,
  SIN_PELO,
  HOODIE_NONE,
  KIT_COLORS,
  MOUTH_STYLES,
  SHIELDS,
  SKIN_TONES,
  type AvatarConfig,
} from "@/lib/avatar";

type SectionId = "look3d" | "position" | "style";
type LobbyStatus = "connecting" | "online" | "offline";
type SubTab = "genero" | "cabello" | "piel";

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

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const SECTIONS: Array<{ id: SectionId; label: string; icon: IconType }> = [
  { id: "look3d", label: "Apariencia", icon: Palette },
  { id: "position", label: "Posición", icon: Shirt },
  { id: "style", label: "Estilo", icon: Sparkles },
];

const SUBTABS: Array<{ id: SubTab; label: string }> = [
  { id: "genero", label: "Género" },
  { id: "cabello", label: "Cabello" },
  { id: "piel", label: "Piel" },
];

const SKIN_NAMES: Record<string, string> = {
  "#ffe0bd": "Porcelana",
  "#fbd5b5": "Marfil",
  "#f1c27d": "Arena",
  "#e8b878": "Trigo",
  "#e0ac69": "Ámbar",
  "#d59b5c": "Miel",
  "#c68642": "Caramelo",
  "#b0703c": "Canela",
  "#8d5524": "Cacao",
  "#7a4526": "Tostado",
  "#5a3a22": "Ébano",
  "#3b2f2f": "Noche",
};

function AssetCard({
  asset,
  manifiesto,
  activo,
  onSelect,
}: {
  asset: AssetAvatar;
  manifiesto: ManifiestoAvatar | null;
  activo: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`av3d-asset ${activo ? "is-active" : ""}`}
      aria-pressed={activo}
      onClick={onSelect}
    >
      <AssetThumb manifiesto={manifiesto} asset={asset} />
      <span className="av3d-asset__name">{asset.nombre}</span>
    </button>
  );
}

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

function PatternChips({
  active,
  onSelect,
  label,
}: {
  active: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div className="av3d__group">
      <span className="av3d__label">{label}</span>
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
    </div>
  );
}

export function AvatarCreator3D({
  value,
  onChange,
  name,
  roomName,
  onContinue,
}: {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
  name?: string;
  roomName?: string;
  onContinue?: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localHumanRef = useRef<FiguraAvatar | null>(null);
  const roomRef = useRef<LobbyRoom | null>(null);
  const sessionIdRef = useRef("");
  const valueRef = useRef(value);
  const nameRef = useRef(name ?? "Crack");
  const roomNameRef = useRef(roomName ?? DEFAULT_ROOM);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
const spinRef = useRef(-0.5);

  const [section, setSection] = useState<SectionId>("look3d");
  const [subtab, setSubtab] = useState<SubTab>("genero");
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const [count, setCount] = useState(1);
  const [assets, setAssets] = useState<AssetAvatar[]>([]);
  // El manifiesto entero, no solo la lista: las miniaturas necesitan `base` para
  // resolver la ruta de cada asset.
  const [manifiesto, setManifiesto] = useState<ManifiestoAvatar | null>(null);

  useEffect(() => {
    let vigente = true;
    void cargarManifiesto().then((m) => {
      if (!vigente) return;
      setAssets(m.assets);
      setManifiesto(m);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
    camera.position.set(0, 1.15, 3.5);
    camera.lookAt(0, 1.02, 0);

    /** Encuadra al avatar para que siempre entre completo, en vertical o horizontal. */
    const fitCamera = (aspect: number) => {
      const vFov = (camera.fov * Math.PI) / 180;
      const distHeight = 2.85 / 2 / Math.tan(vFov / 2);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const distWidth = 1.75 / 2 / Math.tan(hFov / 2);
      const distance = Math.max(distHeight, distWidth);
      camera.position.set(0, 1.16, distance);
      camera.lookAt(0, 1.04, 0);
    };

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f3a, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(2.4, 4.2, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(768, 768);
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

    const local = new FiguraAvatar({ config: valueRef.current, height: 2 });
    localHumanRef.current = local;
    localPivot.add(local.object3D);

    const resize = () => {
      const w = stage.clientWidth || 320;
      const h = stage.clientHeight || 240;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fitCamera(camera.aspect);
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

  const generoAsset = value.gender === "female" ? "femenino" : "masculino";
  // Sin filtro de genero a proposito: la subpestana "Género" muestra los cuerpos de
  // los dos sexos para poder cambiar. Si se filtrara por el genero actual, al elegir
  // uno el otro desapareceria de la lista.
  const cuerpos = assets.filter((a) => a.ocupa.includes("cuerpo"));
  const cabellos = assets.filter(
    (a) =>
      a.ocupa.includes("cabello") &&
      (a.genero === "todos" || a.genero === generoAsset),
  );
  // Los GLB traen el color horneado en la textura, asi que el tinte solo aplica al procedural.
  const peloEsAsset = cabellos.some((a) => a.id === value.cabello);

  const statusLabel =
    status === "online"
      ? `Lobby · ${count}`
      : status === "connecting"
        ? "Conectando"
        : "Modo local";

  return (
    <section className="av3d" aria-label="Estudio de avatar 3D">
      <header className="av3d-head">
        <p className="av3d-head__step">2 · Crear jugador</p>
        <h3 className="av3d-head__title">
          Personalización <span>de avatar</span>
        </h3>
      </header>

      <div className="av3d-grid">
        <nav className="av3d-nav" aria-label="Secciones del avatar">
          <span className="av3d-nav__title">Secciones</span>
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`av3d-nav__item ${active ? "is-active" : ""}`}
                aria-current={active ? "step" : undefined}
                onClick={() => setSection(item.id)}
              >
                <span className="av3d-nav__icon" aria-hidden="true">
                  <Icon width={16} height={16} />
                </span>
                <span className="av3d-nav__label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="av3d-preview">
          <div className="av3d__stage" ref={stageRef}>
            <canvas ref={canvasRef} className="av3d__canvas" />
            <span className={`av3d__badge ${status === "online" ? "is-online" : ""}`}>
              <i aria-hidden="true" />
              {statusLabel}
            </span>
            <span className="av3d__hint">Arrastra para girar</span>
          </div>
          <div className="av3d-preview__foot">
            <span className="av3d-preview__name">{name || "Tu crack"}</span>
            <span className="av3d-preview__meta">
              #{value.number} · {SKIN_NAMES[value.skin] ?? "Personalizado"}
            </span>
          </div>
        </div>

        <aside className="av3d-aside">
          <div className="av3d__panels">
            {section === "look3d" && (
              <div className="av3d__panel">
                <div className="av3d-subtabs" role="tablist" aria-label="Apariencia">
                  {SUBTABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={subtab === item.id}
                      className={`av3d-subtab ${subtab === item.id ? "is-active" : ""}`}
                      onClick={() => setSubtab(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {subtab === "genero" && (
                  <>
                    <span className="av3d__label">Género</span>
                    {cuerpos.length > 0 ? (
                      /* Un solo control: cada tarjeta ES un genero con su modelo, asi
                         que la seccion "Modelo" deja de hacer falta por separado. */
                      <div className="av3d-assets">
                        {cuerpos.map((asset) => {
                          const genero = asset.genero === "femenino" ? "female" : "male";
                          const etiqueta =
                            AVATAR_GENDERS.find((g) => g.id === genero)?.label ??
                            (genero === "male" ? "Masculino" : "Femenino");
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              className={`av3d-asset ${value.gender === genero ? "is-active" : ""}`}
                              aria-pressed={value.gender === genero}
                              onClick={() =>
                                update({ gender: genero, modelo: asset.id, cabello: null })
                              }
                            >
                              <AssetThumb manifiesto={manifiesto} asset={asset} />
                              <span className="av3d-asset__name">{etiqueta}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="av3d__label">No hay modelos de cuerpo disponibles.</span>
                    )}

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
                  </>
                )}

                {subtab === "cabello" && (
                  <>
                    {cabellos.length > 0 ? (
                      <div className="av3d-assets">
                        {cabellos.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            manifiesto={manifiesto}
                            activo={value.cabello === asset.id}
                            onSelect={() => update({ cabello: asset.id })}
                          />
                        ))}
                        <button
                          type="button"
                          className={`av3d-chip ${value.cabello === null ? "is-active" : ""}`}
                          onClick={() => update({ hair: SIN_PELO.id, cabello: null })}
                        >
                          {SIN_PELO.label}
                        </button>
                      </div>
                    ) : (
                      <span className="av3d__label">No hay modelos de pelo disponibles.</span>
                    )}

                    <span className="av3d__label">Color de pelo</span>
                    <div className={`av3d__row ${peloEsAsset ? "is-disabled" : ""}`}>
                      {HAIR_COLORS.map((color) => (
                        <Swatch
                          key={color}
                          color={color}
                          active={value.hairColor === color}
                          onSelect={() => update({ hairColor: color })}
                        />
                      ))}
                    </div>
                    {peloEsAsset && (
                      <p className="av3d__hint">
                        El pelo de estos modelos trae el color horneado en la textura, así que el
                        tinte no se aplica.
                      </p>
                    )}
                  </>
                )}

                {subtab === "piel" && (
                  <>
                    <span className="av3d__label">Tono de piel</span>
                    <div className="av3d-piel">
                      {SKIN_TONES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`av3d-piel__chip ${value.skin === color ? "is-active" : ""}`}
                          aria-label={`Tono ${SKIN_NAMES[color] ?? color}`}
                          aria-pressed={value.skin === color}
                          onClick={() => update({ skin: color })}
                        >
                          <span
                            className="av3d-piel__art"
                            style={{ backgroundColor: color }}
                            aria-hidden="true"
                          />
                          <span className="av3d-piel__name">
                            {SKIN_NAMES[color] ?? color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {section === "position" && (
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
                  label="Patrón de la camisa"
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
                  label="Patrón de la sudadera"
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
                  label="Patrón del pantalón"
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
              </div>
            )}

            {section === "style" && (
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
                      onClick={() => update({ shield: item.id })}
                    >
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
                {value.shieldUrl ? (
                  <p className="av3d__note">El logo del equipo se muestra en la camiseta.</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="av3d-promo">
            <span className="av3d-promo__line av3d-promo__line--solid">Crea</span>
            <span className="av3d-promo__line av3d-promo__line--outline">tu historia</span>
            <span className="av3d-promo__sub">Un crack mejor que tú</span>
          </div>

          {onContinue ? (
            <button type="button" className="av3d-cta" onClick={onContinue}>
              <span>Continuar</span>
              <ArrowRight width={18} height={18} aria-hidden="true" />
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
