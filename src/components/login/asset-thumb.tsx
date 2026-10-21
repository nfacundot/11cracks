"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import * as THREE from "three";
import { cargarEscena } from "@/lib/avatar3d/avatares/figura";
import { urlDeAsset, type AssetAvatar, type ManifiestoAvatar } from "@/lib/avatar3d/avatares/registro";

/** Lado del render en pixeles; en pantalla se escala via CSS. */
const LADO = 192;

/**
 * Miniaturas de los assets del manifiesto.
 *
 * Se renderizan en el cliente con un unico WebGLRenderer compartido y se guardan
 * como data URL, que ademas hace de cache: al reabrir el editor no se crea otro
 * contexto ni se vuelve a renderizar. Para los .glb de cabeza esto es lo unico que
 * muestra de verdad como es el pelo, porque una tarjeta de texto con el tamano del
 * archivo no dice nada del modelo.
 */
type Escenario = {
  renderer: THREE.WebGLRenderer;
  escena: THREE.Scene;
  camara: THREE.PerspectiveCamera;
};

const dataUrls = new Map<string, string>();
const enCurso = new Map<string, Promise<string | null>>();
const suscriptores = new Map<string, Set<() => void>>();
let escenario: Escenario | null = null;

function avisar(clave: string) {
  suscriptores.get(clave)?.forEach((cb) => cb());
}

function obtenerEscenario(): Escenario | null {
  if (escenario) return escenario;
  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  try {
    // preserveDrawingBuffer es obligatorio: sin el, el buffer se borra al componer
    // el frame y toDataURL devuelve una imagen totalmente vacia (un <img> invisible).
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(LADO, LADO, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const escena = new THREE.Scene();
    // Luz suave y pareja: la idea es reconocer la forma, no iluminar un retrato.
    escena.add(new THREE.AmbientLight(0xffffff, 2.1));
    const clave = new THREE.DirectionalLight(0xffffff, 2.4);
    clave.position.set(2, 3, 4);
    escena.add(clave);
    const relleno = new THREE.DirectionalLight(0xcfe0ff, 1.1);
    relleno.position.set(-3, 1, -2);
    escena.add(relleno);

    const camara = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    escenario = { renderer, escena, camara };
    return escenario;
  } catch {
    // Sin WebGL la UI sigue funcionando: solo no habra miniatura.
    return null;
  }
}

/**
 * Mira si el render produjo algo visible. Sin esto, una miniatura vacia se
 * cachearia como data URL y el <img> se veria como un hueco sin pista del motivo.
 */
function tienePixeles(canvas: HTMLCanvasElement): boolean {
  try {
    const copia = document.createElement("canvas");
    copia.width = canvas.width;
    copia.height = canvas.height;
    const ctx = copia.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(canvas, 0, 0);
    const { data } = ctx.getImageData(0, 0, copia.width, copia.height);
    for (let i = 3; i < data.length; i += 4) if (data[i] > 8) return true;
    return false;
  } catch {
    return true;
  }
}

function pintar(url: string): Promise<string | null> {
  const pendiente = enCurso.get(url);
  if (pendiente) return pendiente;

  const tarea = (async () => {
    const ev = obtenerEscenario();
    if (!ev) return null;
    let raiz: THREE.Group | null = null;
    try {
      const escena = await cargarEscena(url);
      // Instancia propia: la escena cacheada la comparte el avatar 3D y aqui solo
      // se lee, pero un Object3D no puede vivir en dos grafos a la vez.
      raiz = new THREE.Group();
      raiz.add(...escena.children.map((c) => c.clone(true)));
      ev.escena.add(raiz);

      const caja = new THREE.Box3().setFromObject(raiz);
      const tam = caja.getSize(new THREE.Vector3());
      if (!(tam.x > 0) || !(tam.y > 0)) return null;

      const centro = caja.getCenter(new THREE.Vector3());
      const radio = Math.max(tam.x, tam.y, tam.z) / 2;
      // Margen para que la silueta no toque el borde.
      const distancia = (radio / Math.tan((ev.camara.fov * Math.PI) / 360)) * 1.2;
      ev.camara.position.set(0, centro.y + radio * 0.12, distancia);
      ev.camara.lookAt(centro);
      ev.camara.updateProjectionMatrix();

      ev.renderer.render(ev.escena, ev.camara);
      if (!tienePixeles(ev.renderer.domElement)) {
        throw new Error("el render salio vacio: modelo fuera de encuadre o material invisible");
      }
      // PNG y no WebP: la lectura del canvas es universal, y como la data URL queda
      // cacheada en memoria el peso extra da igual.
      const dataUrl = ev.renderer.domElement.toDataURL("image/png");
      dataUrls.set(url, dataUrl);
      avisar(url);
      return dataUrl;
    } catch (e) {
      console.warn(`asset-thumb: no se pudo miniatura de ${url}`, e);
      return null;
    } finally {
      if (raiz) {
        ev.escena.remove(raiz);
        raiz.clear();
      }
      enCurso.delete(url);
    }
  })();

  enCurso.set(url, tarea);
  return tarea;
}

function suscribir(clave: string, cb: () => void) {
  let grupo = suscriptores.get(clave);
  if (!grupo) {
    grupo = new Set();
    suscriptores.set(clave, grupo);
  }
  grupo.add(cb);
  if (dataUrls.has(clave)) cb();
  return () => {
    grupo.delete(cb);
    if (!grupo.size) suscriptores.delete(clave);
  };
}

export function useAssetThumb(
  manifiesto: ManifiestoAvatar | null,
  asset: AssetAvatar | null,
): string | null {
  const clave = manifiesto && asset ? urlDeAsset(manifiesto, asset) : "";
  const leer = useCallback(() => (clave ? (dataUrls.get(clave) ?? null) : null), [clave]);
  const url = useSyncExternalStore(useCallback((cb: () => void) => (clave ? suscribir(clave, cb) : () => {}), [clave]), leer, leer);

  useEffect(() => {
    if (clave && !dataUrls.has(clave)) void pintar(clave);
  }, [clave]);

  return url;
}

/**
 * Miniatura de un asset. Mientras carga deja un hueco con la misma proporcion para
 * que la fila de tarjetas no salte de alto cuando llega la imagen.
 */
export function AssetThumb({
  manifiesto,
  asset,
  className,
}: {
  manifiesto: ManifiestoAvatar | null;
  asset: AssetAvatar;
  className?: string;
}) {
  const url = useAssetThumb(manifiesto, asset);
  return (
    <span className={`av3d-thumb ${className ?? ""}`} data-vacio={url ? undefined : "true"}>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL de 192px generada en cliente; next/image no aplica */}
      {url ? <img src={url} alt="" aria-hidden="true" /> : null}
    </span>
  );
}
