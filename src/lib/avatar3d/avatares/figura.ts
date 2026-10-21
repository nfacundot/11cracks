import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { AvatarConfig } from "@/lib/avatar";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatar";
import { LowpolyHuman } from "@/lib/avatar3d/lowpoly-human";
import { detectarCabeza, type AnclaCabeza } from "@/lib/avatar3d/avatares/cabeza";
import { colorPelo, crearPelo } from "@/lib/avatar3d/avatares/pelo";
import {
  buscarAsset,
  cargarManifiesto,
  listarPorSlot,
  urlDeAsset,
  type AssetAvatar,
  type GeneroAvatar,
  type ManifiestoAvatar,
} from "@/lib/avatar3d/avatares/registro";

/** Altura en unidades de escena. */
const ALTURA = 2;
/** Margen sobre el craneo para que el pelo no se hunda en la piel. */
const ESPESOR_PELO = 1.02;
/** Cuanto se fuerza el tinte de piel sobre la textura horneada de Meshy. */
const FUERZA_TINTE = 0.6;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/** Cache de descargas: el mismo .glb no se vuelve a pedir al cambiar de opcion. */
const descargas = new Map<string, Promise<THREE.Group>>();

/**
 * Descarga (con cache de por vida) la escena de un asset del manifiesto. Se exporta
 * para que las miniaturas de la UI reutilicen la misma descarga en vez de bajar el
 * .glb otra vez.
 */
export function cargarEscena(url: string): Promise<THREE.Group> {
  let p = descargas.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((gltf) => gltf.scene);
    descargas.set(url, p);
  }
  return p;
}

type FiguraCargada = {
  root: THREE.Group;
  materiales: THREE.MeshStandardMaterial[];
};

const BASE_PIEL = new THREE.Color(DEFAULT_AVATAR_CONFIG.skin);

/**
 * Los GLB de Meshy traen la piel horneada en la textura base, asi que recolorear
 * solo se puede aproximar multiplicando el color del material. Para un tinte real
 * hace falta una mascara de textura (Meshy "Texture with masks" o Blender).
 */
function aplicarTinte(materiales: THREE.MeshStandardMaterial[], objetivo: string, fuerza: number) {
  const tinte = new THREE.Color(objetivo);
  const tinteCanal = (canal: number, base: number) =>
    THREE.MathUtils.clamp((canal / base) * fuerza + (1 - fuerza), 0.05, 4);
  const r = tinteCanal(tinte.r, BASE_PIEL.r);
  const g = tinteCanal(tinte.g, BASE_PIEL.g);
  const b = tinteCanal(tinte.b, BASE_PIEL.b);
  for (const mat of materiales) {
    mat.color.setRGB(r, g, b);
    mat.needsUpdate = true;
  }
}

/** Copia los meshes con materiales propios; geometria y texturas se comparten. */
function instanciar(scene: THREE.Object3D): FiguraCargada {
  scene.updateMatrixWorld(true);
  const root = new THREE.Group();
  const materiales: THREE.MeshStandardMaterial[] = [];
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const original = mesh.material;
    const copia = new THREE.Mesh(
      mesh.geometry,
      Array.isArray(original) ? original.map((m) => m.clone()) : original.clone(),
    );
    copia.matrixAutoUpdate = false;
    copia.matrix.copy(mesh.matrixWorld);
    copia.castShadow = true;
    copia.receiveShadow = true;
    root.add(copia);
    const mat = copia.material;
    if (Array.isArray(mat)) materiales.push(...(mat as THREE.MeshStandardMaterial[]));
    else materiales.push(mat as THREE.MeshStandardMaterial);
  });
  return { root, materiales };
}

/** Escala a la altura pedida, centra en X/Z y apoya los pies en y = 0. */
function normalizar(root: THREE.Object3D, altura: number) {
  root.updateMatrixWorld(true);
  const tam = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  if (!(tam.y > 0)) return;

  root.scale.setScalar(altura / tam.y);
  root.updateMatrixWorld(true);

  const caja = new THREE.Box3().setFromObject(root);
  const centro = caja.getCenter(new THREE.Vector3());
  root.position.x -= centro.x;
  root.position.z -= centro.z;
  root.position.y -= caja.min.y;
}

function generoDe(cfg: AvatarConfig): GeneroAvatar {
  return cfg.gender === "female" ? "femenino" : "masculino";
}

/**
 * Elige el asset del slot "cuerpo". Un id guardado puede no existir o no ser del
 * genero actual (el usuario cambio de genero), en cuyo caso se usa el primero
 * disponible para ese genero.
 */
export function resolverCuerpo(
  manifiesto: ManifiestoAvatar,
  cfg: AvatarConfig,
): AssetAvatar | null {
  const genero = generoDe(cfg);
  const candidatos = listarPorSlot(manifiesto, "cuerpo", genero);
  if (!candidatos.length) return null;

  const elegido = buscarAsset(manifiesto, cfg.modelo);
  const sirve = elegido && (elegido.genero === "todos" || elegido.genero === genero);
  return elegido && elegido.ocupa.includes("cuerpo") && sirve
    ? elegido
    : (candidatos[0] as AssetAvatar);
}

/**
 * Elige el asset del slot "cabello". Devuelve null cuando toca pelo procedural,
 * que es lo que se usa si el usuario no eligio ninguno, si el id guardado no
 * existe, si ya no es del genero actual o si el manifiesto no respondio.
 */
export function resolverCabello(
  manifiesto: ManifiestoAvatar,
  cfg: AvatarConfig,
): AssetAvatar | null {
  const genero = generoDe(cfg);
  const elegido = buscarAsset(manifiesto, cfg.cabello);
  if (!elegido?.ocupa.includes("cabello")) return null;
  return elegido.genero === "todos" || elegido.genero === genero ? elegido : null;
}

/**
 * Figura del avatar: carga el cuerpo GLB configurado, le ancla el pelo —GLB o
 * procedural— a la cabeza detectada y cae al avatar procedural si el manifiesto
 * no esta disponible o el archivo falla. Expone la misma API que LowpolyHuman
 * para poder sustituirlo en el panel sin tocar el resto.
 */
export class FiguraAvatar {
  readonly object3D = new THREE.Group();

  private readonly slot = new THREE.Group();
  private readonly altura: number;
  private procedural: LowpolyHuman | null = null;
  private cuerpo: FiguraCargada | null = null;
  private pelo: THREE.Group | null = null;
  private ancla: AnclaCabeza | null = null;
  private manifiesto: ManifiestoAvatar | null = null;
  /** Firma de lo que hay montado: `glb:<id>` o `proc:<estilo>`; "" si no hay pelo. */
  private peloFirma = "";
  private tokenPelo = 0;
  private firma = "";
  private token = 0;
  private cfg: AvatarConfig;

  constructor({ config, height = ALTURA }: { config: AvatarConfig; height?: number }) {
    this.cfg = config;
    this.altura = height;
    this.object3D.add(this.slot);
    this.usarProcedural();
    void this.pintar(config);
  }

  setConfig(config: AvatarConfig) {
    this.cfg = config;
    this.procedural?.setConfig(config);
    // El cuerpo ya montado no pasa por pintar(): hay que retintarlo aqui.
    if (this.cuerpo) aplicarTinte(this.cuerpo.materiales, config.skin, FUERZA_TINTE);
    this.aplicarPelo(config);
    void this.pintar(config);
  }

  setWalk(phase: number, amount: number) {
    this.procedural?.setWalk(phase, amount);
  }

  sit() {
    this.procedural?.sit();
  }

  stand() {
    this.procedural?.stand();
  }

  lie(phase = 0) {
    this.procedural?.lie(phase);
  }

  perform(action: "brush" | "drink" | "eat" | "shower" | "toilet", phase = 0) {
    this.procedural?.perform(action, phase);
  }

  dispose() {
    this.quitarPelo();
    this.limpiarCuerpo();
    this.procedural?.dispose();
    this.procedural = null;
  }

  /**
   * Monta el pelo en la cabeza del cuerpo GLB: asset del manifiesto si el usuario
   * eligio uno, y en su defecto el pelo procedural de `cfg.hair`.
   *
   * El pelo va colgado de `slot`, no de `cuerpo.root`: el ancla de
   * `detectarCabeza()` viene en el espacio de `slot`, mientras que `cuerpo.root`
   * tiene escala y offset por la normalizacion a `altura`. Si se colgara de ahi,
   * el pelo caeria dentro del torso. Por el mismo motivo los GLB de `web/` estan
   * publicados en ese mismo espacio de cabeza (origen al centro, radioX = 1), y
   * solo hay que escalarlos por `ancla.radioX`.
   */
  private aplicarPelo(cfg: AvatarConfig) {
    if (!this.cuerpo || !this.ancla) return;
    const asset = this.manifiesto ? resolverCabello(this.manifiesto, cfg) : null;
    const firma = asset ? `glb:${asset.id}` : cfg.hair === "none" ? "" : `proc:${cfg.hair}`;

    if (firma === this.peloFirma && this.pelo) {
      // Solo el procedural se puede reteñir en caliente.
      if (!asset) colorPelo(this.pelo, cfg.hairColor);
      return;
    }

    this.quitarPelo();
    if (!firma) return;

    if (asset) {
      // Se reserva la firma antes de esperar para no encolar descargas duplicadas.
      this.peloFirma = firma;
      void this.montarPeloAsset(asset, firma);
      return;
    }
    this.montarPeloProcedural(cfg);
  }

  private montarPeloProcedural(cfg: AvatarConfig) {
    if (!this.ancla || cfg.hair === "none") return;
    const grupo = crearPelo(cfg.hair, cfg.hairColor);
    grupo.scale.setScalar(this.ancla.radioX * ESPESOR_PELO);
    grupo.position.copy(this.ancla.centro);
    this.slot.add(grupo);
    this.pelo = grupo;
    this.peloFirma = `proc:${cfg.hair}`;
  }

  private async montarPeloAsset(asset: AssetAvatar, firma: string) {
    const mio = ++this.tokenPelo;
    try {
      const escena = await cargarEscena(urlDeAsset(this.manifiesto as ManifiestoAvatar, asset));
      // El usuario pudo cambiar de opcion o de cuerpo mientras descargaba.
      if (mio !== this.tokenPelo || !this.ancla) return;

      const { root } = instanciar(escena);
      root.scale.setScalar(this.ancla.radioX * ESPESOR_PELO);
      root.position.copy(this.ancla.centro);
      this.slot.add(root);
      this.pelo = root;
      this.peloFirma = firma;
    } catch {
      // GLB roto o red caida: se cae al pelo procedural para no dejar calvo.
      if (mio !== this.tokenPelo) return;
      this.peloFirma = "";
      this.montarPeloProcedural(this.cfg);
    }
  }

  private quitarPelo() {
    this.tokenPelo += 1;
    this.peloFirma = "";
    if (!this.pelo) return;
    this.pelo.parent?.remove(this.pelo);
    this.pelo.traverse((obj) => {
      const mat = (obj as THREE.Mesh).material;
      if (!mat) return;
      for (const m of Array.isArray(mat) ? mat : [mat]) (m as THREE.Material).dispose();
    });
    this.pelo = null;
  }

  private async pintar(cfg: AvatarConfig) {
    const manifiesto = await cargarManifiesto();
    this.manifiesto = manifiesto;
    const cuerpo = resolverCuerpo(manifiesto, cfg);
    if (!cuerpo) {
      this.aplicarPelo(cfg);
      return;
    }

    const firma = `${cuerpo.id}|${this.altura}`;
    if (firma === this.firma) return;
    // Se reserva antes de esperar para no duplicar peticiones en paralelo.
    this.firma = firma;
    const mio = ++this.token;

    try {
      const escena = await cargarEscena(urlDeAsset(manifiesto, cuerpo));
      if (mio !== this.token) return;

      const cargada = instanciar(escena);
      normalizar(cargada.root, this.altura);
      this.ancla = detectarCabeza(cargada.root);

      this.limpiarCuerpo();
      this.slot.add(cargada.root);
      this.cuerpo = cargada;
      if (this.procedural) this.procedural.object3D.visible = false;
      aplicarTinte(cargada.materiales, cfg.skin, FUERZA_TINTE);
      this.aplicarPelo(cfg);
    } catch {
      // Archivo roto o red caida: seguimos con el procedural ya montado.
    }
  }

  private usarProcedural() {
    this.procedural = new LowpolyHuman({ config: this.cfg, height: this.altura });
    this.slot.add(this.procedural.object3D);
  }

  private limpiarCuerpo() {
    if (this.procedural) this.procedural.object3D.visible = true;
    this.quitarPelo();
    if (!this.cuerpo) return;
    this.slot.remove(this.cuerpo.root);
    for (const mat of this.cuerpo.materiales) mat.dispose();
    this.cuerpo = null;
    this.ancla = null;
  }
}

export function createFiguraAvatar(options: { config: AvatarConfig; height?: number }) {
  return new FiguraAvatar(options);
}
