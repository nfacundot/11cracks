import * as THREE from "three";

export type AnclaCabeza = {
  centro: THREE.Vector3;
  radioX: number;
  radioY: number;
  radioZ: number;
};

/** Proporcion de referencia: un humano adulto mide unas 7.5 cabezas. */
const CABECAS = 7.5;

/**
 * Localiza la cabeza a partir de la geometria, sin esqueleto.
 *
 * Los export de Meshy no traen huesos, asi que el ancla se deriva de la
 * proporcion corporal y despues se refina con los vertices reales de esa
 * banda: el centro se queda con la mediana (el pelo y los brazos outliers se
 * descartan por distancia) y los radios salen del ancho/profundidad medidos.
 *
 * Escala 1 = mitad del ancho de la cabeza, con el origen en su centro.
 */
export function detectarCabeza(root: THREE.Object3D): AnclaCabeza | null {
  root.updateMatrixWorld(true);

  const puntos: number[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    if (!pos) return;
    const m = mesh.matrixWorld;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      puntos.push(v.x, v.y, v.z);
    }
  });
  if (puntos.length < 30) return null;

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < puntos.length; i += 3) {
    minY = Math.min(minY, puntos[i] as number);
    maxY = Math.max(maxY, puntos[i] as number);
  }
  const alto = maxY - minY;
  if (!(alto > 0)) return null;

  const altoCabeza = alto / CABECAS;
  const yCentro = maxY - altoCabeza * 0.52;
  const ventana = altoCabeza * 0.35;
  const radioMax = alto * 0.13;

  let sel = puntos;
  for (let vuelta = 0; vuelta < 3; vuelta += 1) {
    const enVentana: number[] = [];
    for (let i = 0; i < puntos.length; i += 3) {
      if (Math.abs((puntos[i + 1] as number) - yCentro) <= ventana) {
        enVentana.push(puntos[i] as number, puntos[i + 1] as number, puntos[i + 2] as number);
      }
    }
    if (!enVentana.length) return null;
    sel = enVentana;

    const ejeX = mediana(sel, 0);
    const ejeZ = mediana(sel, 2);
    const cerca: number[] = [];
    for (let i = 0; i < sel.length; i += 3) {
      const dx = (sel[i] as number) - ejeX;
      const dz = (sel[i + 2] as number) - ejeZ;
      if (dx * dx + dz * dz <= radioMax * radioMax) cerca.push(sel[i], sel[i + 1], sel[i + 2]);
    }
    sel = cerca.length >= 12 ? cerca : sel;
  }

  const cx = mediana(sel, 0);
  const cz = mediana(sel, 2);
  let radioX = 0;
  let radioZ = 0;
  for (let i = 0; i < sel.length; i += 3) {
    radioX = Math.max(radioX, Math.abs((sel[i] as number) - cx));
    radioZ = Math.max(radioZ, Math.abs((sel[i + 2] as number) - cz));
  }
  if (!(radioX > 0)) return null;

  return {
    centro: new THREE.Vector3(cx, yCentro, cz),
    radioX,
    radioY: altoCabeza * 0.5,
    radioZ,
  };
}

function mediana(datos: number[], eje: number) {
  const fila: number[] = [];
  for (let i = eje; i < datos.length; i += 3) fila.push(datos[i] as number);
  fila.sort((a, b) => a - b);
  return fila[Math.floor(fila.length / 2)] as number;
}
