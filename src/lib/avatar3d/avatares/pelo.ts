import * as THREE from "three";

/**
 * Pelo generado en "espacio de cabeza": 1.0 = mitad del ancho de la cabeza, con
 * el origen en su centro, +Y arriba y +Z al frente. `FiguraAvatar` lo coloca
 * sobre el ancla que devuelve `detectarCabeza`, asi que el pelo queda pegado a
 * la cabeza del cuerpo GLB en vez de ser otro avatar.
 *
 * Proporciones medidas con `npm run avatares:cabeza` sobre los cuerpos ya
 * optimizados: ry/rx = 1.340 (masculino) y 1.346 (femenino); rz/rx = 1.377
 * (masculino) y 1.292 (femenino). Se usa el promedio de la profundidad.
 */
const RX = 1;
const RY = 1.34;
const RZ = 1.33;

/** Frente en +Z (phi = PI/2 en SphereGeometry). */
const FRENTE = Math.PI / 2;
const ABERTURA_FRONTE = 0.62;

type Pieza = { geo: THREE.BufferGeometry; x: number; y: number; z: number; rx?: number; ry?: number; rz?: number; rot?: [number, number, number] };

const cache = new Map<string, Pieza[]>();

function casco(thetaLength: number, escala = 1.06, abertura = ABERTURA_FRONTE): Pieza {
  const geo = new THREE.SphereGeometry(1, 18, 10, FRENTE + abertura, Math.PI * 2 - abertura * 2, 0, thetaLength);
  return { geo, x: 0, y: 0, z: 0, rx: RX * escala, ry: RY * escala, rz: RZ * escala };
}

function bloque(w: number, h: number, d: number, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]): Pieza {
  return { geo: new THREE.BoxGeometry(w, h, d), x, y, z, rot };
}

function cono(r: number, h: number, x: number, y: number, z: number, rot: [number, number, number] = [0, 0, 0]): Pieza {
  return { geo: new THREE.ConeGeometry(r, h, 6), x, y, z, rot };
}

function bola(r: number, x: number, y: number, z: number, escalaY = 1): Pieza {
  return { geo: new THREE.SphereGeometry(r, 8, 6), x, y, z, ry: r * escalaY, rx: r, rz: r };
}

/** Recorta el casco por detras (phi desde el frente hacia atras). */
function melenaLarga(): Pieza[] {
  return [
    casco(Math.PI * 0.86, 1.05),
    bloque(0.52, 1.15, 0.3, 0, -0.75, -0.92, [0.16, 0, 0]),
    bloque(0.26, 0.9, 0.28, -0.95, -0.5, -0.2, [0, 0, 0.14]),
    bloque(0.26, 0.9, 0.28, 0.95, -0.5, -0.2, [0, 0, -0.14]),
  ];
}

function piezas(style: string): Pieza[] {
  switch (style) {
    case "short":
      return [casco(Math.PI * 0.56, 1.05), bloque(0.9, 0.16, 0.34, 0, 0.72, 1.0, [0.5, 0, 0])];
    case "fringe":
      return [casco(Math.PI * 0.58, 1.05), bloque(0.94, 0.2, 0.36, 0, 0.66, 0.98, [0.42, 0, 0])];
    case "spiky": {
      const picos: Pieza[] = [casco(Math.PI * 0.54, 1.04)];
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        picos.push(
          cono(0.13, 0.5, Math.cos(a) * 0.72, 1.2, Math.sin(a) * 0.95 - 0.15, [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]),
        );
      }
      return picos;
    }
    case "side":
      return [
        casco(Math.PI * 0.6, 1.06),
        bloque(0.42, 0.7, 0.44, -1.0, -0.15, 0.25, [0, 0, 0.1]),
        bloque(0.8, 0.14, 0.3, 0, 0.66, 1.0, [0.46, 0, 0]),
      ];
    case "afro":
      return [casco(Math.PI * 0.72, 1.42), bola(0.42, 0, 1.15, -0.1, 0.8)];
    case "curly": {
      const rizos: Pieza[] = [casco(Math.PI * 0.56, 1.06)];
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * Math.PI * 2;
        rizos.push(bola(0.24, Math.cos(a) * 0.85, 0.95 + Math.sin(i) * 0.2, Math.sin(a) * 1.05 - 0.12));
      }
      return rizos;
    }
    case "long":
      return melenaLarga();
    case "bun":
      return [casco(Math.PI * 0.58, 1.05), bola(0.42, 0, 1.28, -0.5), bloque(0.5, 0.34, 0.3, 0, 0.42, -0.9, [0.4, 0, 0])];
    case "ponytail": {
      const cola: Pieza[] = [casco(Math.PI * 0.56, 1.05), bloque(0.34, 0.9, 0.32, 0, 0.2, -1.15, [-0.5, 0, 0])];
      cola.push(bola(0.2, 0, -0.16, -1.5));
      return cola;
    }
    default:
      return [];
  }
}

function piezasDe(style: string): Pieza[] {
  const cacheado = cache.get(style);
  if (cacheado) return cacheado;
  const nuevo = piezas(style);
  cache.set(style, nuevo);
  return nuevo;
}

/**
 * Devuelve el pelo como grupo listo para anclar. Llama a `.dispose()` en el
 * material cuando dejes de usarlo; las geometrias estan cacheadas y se comparten.
 */
export function crearPelo(style: string, color: string): THREE.Group {
  const grupo = new THREE.Group();
  if (style === "none") return grupo;

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.82,
    metalness: 0.02,
    flatShading: false,
  });
  grupo.userData.material = material;

  for (const pieza of piezasDe(style)) {
    const malla = new THREE.Mesh(pieza.geo, material);
    malla.position.set(pieza.x, pieza.y, pieza.z);
    if (pieza.rx || pieza.ry || pieza.rz) malla.scale.set(pieza.rx ?? 1, pieza.ry ?? 1, pieza.rz ?? 1);
    if (pieza.rot) malla.rotation.set(pieza.rot[0], pieza.rot[1], pieza.rot[2]);
    malla.castShadow = true;
    malla.receiveShadow = true;
    grupo.add(malla);
  }
  return grupo;
}

export function colorPelo(grupo: THREE.Group, color: string) {
  const material = grupo.userData.material as THREE.MeshStandardMaterial | undefined;
  if (material) material.color.set(color);
}

/** Libera las geometrias cacheadas (solo al desmontar la vista). */
export function liberarCachePelo() {
  for (const lista of cache.values()) {
    for (const pieza of lista) pieza.geo.dispose();
  }
  cache.clear();
}
