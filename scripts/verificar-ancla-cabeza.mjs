/**
 * Comprueba que detectarCabeza() cae sobre la cabeza de los .glb ya optimizados.
 *
 * Los archivos publicados usan EXT_meshopt_compression, que no se puede leer crudo
 * en Node, asi que primero se re-codifican a float plano con la misma geometria
 * (--compress false) y se mide ahi. Importa el modulo real, no una copia.
 *
 * Uso: npx tsx scripts/verificar-ancla-cabeza.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as THREE from "three";
import { detectarCabeza } from "../src/lib/avatar3d/avatares/cabeza";

const ARCHIVOS = [
  "public/models/avatares/web/av_mal.glb",
  "public/models/avatares/web/av_fem.glb",
];

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

const tmp = mkdtempSync(join(tmpdir(), "glb-plano-"));
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
let fallos = 0;

try {
  for (const ruta of ARCHIVOS) {
    const plano = join(tmp, ruta.split("/").pop());
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
      ],
      { stdio: "ignore", shell: true }, // Node >=22 pide shell:true para los .cmd
    );

    const { gltf, bin } = leerGlb(plano);
    const { root, total } = construirGrupo(gltf, bin);
    const caja = new THREE.Box3().setFromObject(root);
    const alto = caja.max.y - caja.min.y;
    const altoCabeza = alto / CABECAS;

    const ancla = detectarCabeza(root);
    console.log(`\n${ruta}  (${total} vertices)`);
    console.log(
      `  alto ${alto.toFixed(4)}  y ${caja.min.y.toFixed(3)}..${caja.max.y.toFixed(3)}  altoCabeza ${altoCabeza.toFixed(4)}`,
    );

    if (!ancla) {
      console.log("  NO SE PUDO DETECTAR LA CABEZA");
      fallos += 1;
      continue;
    }

    const cabezaBaja = caja.max.y - altoCabeza;
    const dentro = ancla.centro.y > cabezaBaja && ancla.centro.y < caja.max.y;
    const radioY = altoCabeza * 0.5;

    console.log(
      `  ancla  x ${ancla.centro.x.toFixed(4)}  y ${ancla.centro.y.toFixed(4)}  z ${ancla.centro.z.toFixed(4)}`,
    );
    console.log(
      `  radioX ${ancla.radioX.toFixed(4)}  radioY ${radioY.toFixed(4)}  radioZ ${ancla.radioZ.toFixed(4)}`,
    );
    console.log(`  proportions  ry/rx ${(radioY / ancla.radioX).toFixed(3)}  rz/rx ${(ancla.radioZ / ancla.radioX).toFixed(3)}`);
    console.log(`  banda de cabeza ${cabezaBaja.toFixed(3)}..${caja.max.y.toFixed(3)}`);
    console.log(
      `  pelo (pelo.ts) cubre y ${(ancla.centro.y - radioY).toFixed(3)}..${(ancla.centro.y + radioY).toFixed(3)}`,
    );
    console.log(`  -> ancla sobre la cabeza: ${dentro ? "OK" : "REVISAR"}`);
    if (!dentro) fallos += 1;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(fallos ? `\n${fallos} archivo(s) con problemas.` : "\nTodo correcto.");
process.exit(fallos ? 1 : 0);
