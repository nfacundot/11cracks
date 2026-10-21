/**
 * Comprueba que el pelo GLB queda sobre la cabeza del cuerpo al que se ancla.
 *
 * Reproduce exactamente lo que hace FiguraAvatar.aplicarPelo(): el pelo se cuelga
 * de `slot` (no de `cuerpo.root`), escalado por `ancla.radioX * ESPESOR_PELO` y
 * trasladado a `ancla.centro`. Los .glb publicados usan EXT_meshopt_compression,
 * que no se puede leer crudo en Node, asi que primero se re-codifican a float
 * plano con la misma geometria (--compress false) y se mide ahi.
 *
 * Uso: npx tsx scripts/verificar-pelo.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as THREE from "three";
import { detectarCabeza } from "../src/lib/avatar3d/avatares/cabeza";
import { leerManifiestoLocal } from "./leer-manifiesto.mjs";

/** Debe coincidir con ESPESOR_PELO en figura.ts. */
const ESPESOR_PELO = 1.02;

/** Proporcion de referencia que usa detectarCabeza(); solo para el reporte. */
const CABECAS = 7.5;

function leerGlb(ruta) {
  const buffer = readFileSync(ruta);
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error(`${ruta} no es un GLB`);
  const total = buffer.readUInt32LE(8);
  let offset = 12;
  let gltf = null;
  let bin = null;
  while (offset < total) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) gltf = JSON.parse(data.toString("utf8"));
    else if (type === 0x004e4942) bin = data;
    offset += 8 + length + ((4 - (length % 4)) % 4);
  }
  if (!gltf || !bin) throw new Error(`${ruta} incompleto`);
  return { gltf, bin };
}

/** Matriz 4x4 columna-mayor a partir de TRS, como la que usa three.js. */
function matrizDeNodo(nodo) {
  const t = nodo?.translation ?? [0, 0, 0];
  const s = nodo?.scale ?? [1, 1, 1];
  const q = nodo?.rotation ?? [0, 0, 0, 1];
  const [x, y, z, w] = q;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  return new THREE.Matrix4().set(
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  );
}

/** Arma un Group con las posiciones ya en espacio de mundo. */
function construirGrupo(gltf, bin) {
  const nodosPorMesh = new Map();
  (gltf.nodes ?? []).forEach((nodo) => {
    if (nodo.mesh !== undefined) nodosPorMesh.set(nodo.mesh, matrizDeNodo(nodo));
  });

  const root = new THREE.Group();
  let total = 0;

  (gltf.meshes ?? []).forEach((mesh, indiceMesh) => {
    const matriz = nodosPorMesh.get(indiceMesh) ?? new THREE.Matrix4();
    for (const prim of mesh.primitives ?? []) {
      const acc = gltf.accessors?.[prim.attributes?.POSITION];
      if (!acc) continue;
      if (acc.componentType !== 5126) throw new Error("se esperaba POSITION float32");
      const view = gltf.bufferViews[acc.bufferView];
      const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
      const stride = view.byteStride ?? 12;

      const posiciones = new Float32Array(acc.count * 3);
      const punto = new THREE.Vector3();
      for (let i = 0; i < acc.count; i += 1) {
        const o = base + i * stride;
        punto
          .set(bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8))
          .applyMatrix4(matriz);
        posiciones[i * 3] = punto.x;
        posiciones[i * 3 + 1] = punto.y;
        posiciones[i * 3 + 2] = punto.z;
      }

      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
      root.add(new THREE.Mesh(geometria, new THREE.MeshBasicMaterial()));
      total += acc.count;
    }
  });

  return { root, total };
}

/** Re-codifica a float plano para poder leer POSITION sin el decodificador meshopt. */
const tmp = mkdtempSync(join(tmpdir(), "pelo-plano-"));
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

function aPlano(ruta) {
  const plano = join(tmp, ruta.replace(/[\\/]/g, "_"));
  execFileSync(
    NPX,
    [
      "--yes",
      "@gltf-transform/cli@4.5.1",
      "optimize",
      ruta,
      plano,
      "--compress",
      "false",
      "--texture-compress",
      "false",
      "--simplify",
      "false",
    ],
    { stdio: "ignore", shell: true }, // Node >=22 pide shell:true para los .cmd
  );
  return construirGrupo(...Object.values(leerGlb(plano)));
}

let fallos = 0;

try {
  const manifiesto = leerManifiestoLocal();
  const cuerpos = manifiesto.assets.filter((a) => a.ocupa.includes("cuerpo"));
  const cabellos = manifiesto.assets.filter((a) => a.ocupa.includes("cabello"));

  if (!cuerpos.length) {
    console.log("El manifiesto no declara ningun cuerpo.");
    process.exit(1);
  }
  if (!cabellos.length) {
    console.log("El manifiesto no declara ningun asset de cabello.");
    process.exit(1);
  }

  // Los cuerpos son la referencia de anclaje: el pelo se normaliza contra ellos.
  const referencias = new Map();
  for (const cuerpo of cuerpos) {
    const { root } = aPlano(`public/models/avatares/${cuerpo.archivo}`);
    const ancla = detectarCabeza(root);
    if (!ancla) {
      console.log(`  ${cuerpo.id}: NO SE PUDO DETECTAR LA CABEZA`);
      fallos += 1;
      continue;
    }
    const caja = new THREE.Box3().setFromObject(root);
    const alto = caja.max.y - caja.min.y;
    referencias.set(cuerpo.id, { ancla, alto, tope: caja.max.y, base: alto / CABECAS });
    console.log(`\ncuerpo ${cuerpo.id}`);
    console.log(
      `  alto ${alto.toFixed(4)}  y ${caja.min.y.toFixed(3)}..${caja.max.y.toFixed(3)}  banda de cabeza ${(caja.max.y - alto / CABECAS).toFixed(3)}..${caja.max.y.toFixed(3)}`,
    );
    console.log(
      `  ancla x ${ancla.centro.x.toFixed(4)} y ${ancla.centro.y.toFixed(4)} z ${ancla.centro.z.toFixed(4)}  radioX ${ancla.radioX.toFixed(4)}  radioZ ${ancla.radioZ.toFixed(4)}`,
    );
  }

  for (const pelo of cabellos) {
    const rutaPelo = `public/models/avatares/${pelo.archivo}`;
    if (!existsSync(rutaPelo)) {
      console.log(`\n${pelo.id}: falta ${rutaPelo}`);
      fallos += 1;
      continue;
    }

    const { root: raizPelo } = aPlano(rutaPelo);
    const cajaPelo = new THREE.Box3().setFromObject(raizPelo);
    console.log(`\npelo ${pelo.id}  (${pelo.kb} KB, ${pelo.triangulos} tri, genero ${pelo.genero})`);
    console.log(
      `  caja publicada en espacio de cabeza: x ${cajaPelo.min.x.toFixed(2)}..${cajaPelo.max.x.toFixed(2)}  y ${cajaPelo.min.y.toFixed(2)}..${cajaPelo.max.y.toFixed(2)}  z ${cajaPelo.min.z.toFixed(2)}..${cajaPelo.max.z.toFixed(2)}`,
    );

    // El pelo se ancla por el radioX del cuerpo, asi que se prueba contra TODOS los
    // cuerpos aunque el manifiesto lo marque de un solo genero: si el recorte no
    // encaja con el otro genero, conviene saberlo antes de abrirlo.
    const objetivos = cuerpos;

    for (const cuerpo of objetivos) {
      const ref = referencias.get(cuerpo.id);
      if (!ref) continue;
      const { ancla, tope, base } = ref;
      const radioY = base * 0.5;
      const cabezaBaja = tope - base;

      // Esto es exactamente lo que hace FiguraAvatar.montarPeloAsset().
      const escala = ancla.radioX * ESPESOR_PELO;
      raizPelo.scale.setScalar(escala);
      raizPelo.position.copy(ancla.centro);
      raizPelo.updateMatrixWorld(true);
      const caja = new THREE.Box3().setFromObject(raizPelo);

      const ancho = caja.max.x - caja.min.x;
      const altoPelo = caja.max.y - caja.min.y;
      const fondo = caja.max.z - caja.min.z;
      const anchoCabeza = ancla.radioX * 2;
      const fondoCabeza = ancla.radioZ * 2;
      const altoCabeza = radioY * 2;

      console.log(`  contra ${cuerpo.id}: escala ${escala.toFixed(5)}`);
      console.log(
        `    pelo en espacio del cuerpo: x ${caja.min.x.toFixed(4)}..${caja.max.x.toFixed(4)}  y ${caja.min.y.toFixed(4)}..${caja.max.y.toFixed(4)}  z ${caja.min.z.toFixed(4)}..${caja.max.z.toFixed(4)}`,
      );
      console.log(`    banda de cabeza y ${cabezaBaja.toFixed(4)}..${tope.toFixed(4)}`);
      console.log(
        `    proporcion vs cabeza: ancho ${(ancho / anchoCabeza).toFixed(2)}x  alto ${(altoPelo / altoCabeza).toFixed(2)}y  fondo ${(fondo / fondoCabeza).toFixed(2)}z`,
      );

      // El pelo envuelve el craneo, asi que se espera algo mas ancho que la
      // cabeza (el volumen del pelo) sin llegar a los brazos, centrado en el eje
      // y contenido en la banda vertical de la cabeza. Se admite que la copa asome
      // un poco por encima del craneo: un pelo voluminoso coronado excede el
      // vertice del modelo sin estar mal anclado, y recortarlo para cumplir esto
      // deformaria el asset.
      const okAncho = ancho > anchoCabeza * 0.9 && ancho <= anchoCabeza * 1.9;
      const okFondo = fondo <= fondoCabeza * 1.9;
      const okCentro = Math.abs((caja.min.x + caja.max.x) / 2) <= ancla.radioX * 0.25;
      const okY = caja.max.y <= tope + base * 0.15 && caja.min.y >= cabezaBaja - base * 0.25;

      console.log(
        `    ancho ${okAncho ? "OK" : "FUERA DE RANGO"} · fondo ${okFondo ? "OK" : "FUERA DE RANGO"} · centrado ${okCentro ? "OK" : "DESCENTRADO"} · sobre la cabeza ${okY ? "OK" : "MAL COLOCADO"}`,
      );
      if (!okAncho || !okFondo || !okY || !okCentro) fallos += 1;

      // Se deshace para poder medir el siguiente cuerpo.
      raizPelo.scale.setScalar(1);
      raizPelo.position.set(0, 0, 0);
      raizPelo.updateMatrixWorld(true);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(fallos ? `\n${fallos} problema(s).` : "\nTodo correcto.");
process.exit(fallos ? 1 : 0);
