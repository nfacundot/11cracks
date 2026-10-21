/**
 * Compara el espacio 3D de los cuerpos calvos con el de los personajes con pelo.
 * Si coinciden (misma escala, origen y orientacion) se puede recortar el pelo
 * de los personajes y montarlo sobre el cuerpo calvo sin alinear nada.
 */
import { readFileSync } from "node:fs";

const RUTAS = [
  "assets-3d/avatares/masc/av_mal.glb",
  "assets-3d/avatares/fem/av_fem.glb",
  "assets-3d/avatares/cabello_m/cab1.glb",
  "assets-3d/avatares/cabello_m/cab2.glb",
];

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
    offset += 8 + length;
  }
  if (!gltf || !bin) throw new Error(`${ruta} incompleto`);
  return { gltf, bin };
}

function posicionesDe(gltf, bin) {
  const out = [];
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const acc = gltf.accessors?.[prim.attributes?.POSITION];
      if (!acc) continue;
      const view = gltf.bufferViews[acc.bufferView];
      const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
      for (let i = 0; i < acc.count; i += 1) {
        out.push(bin.readFloatLE(base + i * 12), bin.readFloatLE(base + i * 12 + 4), bin.readFloatLE(base + i * 12 + 8));
      }
    }
  }
  return new Float32Array(out);
}

function metricas(pos) {
  const box = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      box.min[a] = Math.min(box.min[a], pos[i + a]);
      box.max[a] = Math.max(box.max[a], pos[i + a]);
    }
  }
  const alto = box.max[1] - box.min[1];
  // Region de la cabeza: 12% superior del personaje.
  const yCabeza = box.min[1] + alto * 0.88;
  const cab = { n: 0, cx: 0, cy: 0, cz: 0, ancho: 0, fondo: 0 };
  const hombros = { n: 0, ancho: 0 };
  const yHombros = box.min[1] + alto * 0.82;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    if (y >= yCabeza) {
      cab.n += 1;
      cab.cx += x; cab.cy += y; cab.cz += z;
      cab.ancho = Math.max(cab.ancho, Math.abs(x - (cab.cx / Math.max(1, cab.n))));
      cab.fondo = Math.max(cab.fondo, Math.abs(z));
    }
    if (yHombros <= y && y < yHombros + alto * 0.02) {
      hombros.n += 1;
      hombros.ancho = Math.max(hombros.ancho, Math.abs(x));
    }
  }
  return {
    minY: +box.min[1].toFixed(4),
    maxY: +box.max[1].toFixed(4),
    alto: +alto.toFixed(4),
    anchoX: +(box.max[0] - box.min[0]).toFixed(4),
    fondoZ: +(box.max[2] - box.min[2]).toFixed(4),
    cabeza: cab.n
      ? {
          centro: [+(cab.cx / cab.n).toFixed(4), +(cab.cy / cab.n).toFixed(4), +(cab.cz / cab.n).toFixed(4)],
          ancho: +cab.ancho.toFixed(4),
          fondo: +cab.fondo.toFixed(4),
        }
      : null,
    hombrosAncho: +hombros.ancho.toFixed(4),
  };
}

for (const ruta of RUTAS) {
  const { gltf, bin } = leerGlb(ruta);
  const m = metricas(posicionesDe(gltf, bin));
  console.log(`\n${ruta}`);
  console.log(`  alto ${m.alto}  anchoX ${m.anchoX}  fondoZ ${m.fondoZ}  y ${m.minY}..${m.maxY}`);
  console.log(`  cabeza ${m.cabeza ? JSON.stringify(m.cabeza) : "-"}`);
  console.log(`  ancho hombros ${m.hombrosAncho}`);
}