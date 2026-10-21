import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RAIZ = process.argv[2] ?? join(process.cwd(), "public", "models", "avatares");
const MODO_PERFIL = process.argv.includes("--perfil");
const UMBRAL_MOVIL_KB = 2500;

function leerGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error("no es un GLB (firma glTF inválida)");
  const total = buffer.readUInt32LE(8);
  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < total) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
    else if (type === 0x004e4942) bin = data;
    offset += 8 + length + ((4 - (length % 4)) % 4);
  }
  if (!json) throw new Error("el GLB no tiene chunk JSON");
  return { json, bin };
}

function contarTriangulos(gltf) {
  let tri = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const acc = gltf.accessors?.[prim.indices];
      const count = acc?.count ?? gltf.accessors?.[prim.attributes?.POSITION]?.count ?? 0;
      const mode = prim.mode ?? 4;
      if (mode === 4) tri += Math.floor(count / 3);
      else if (mode === 5 || mode === 6) tri += Math.max(0, count - 2);
    }
  }
  return tri;
}

/**
 * Caja desde el min/max del JSON. Ojo: con KHR_mesh_quantization los valores estan
 * en el dominio comprimido, asi que el resultado no es la caja real (sirve para
 * archivos sin comprimir, como los originales de assets-3d).
 */
function caja(gltf) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const acc = gltf.accessors?.[prim.attributes?.POSITION];
      if (!acc?.min || !acc?.max) continue;
      for (let i = 0; i < 3; i += 1) {
        min[i] = Math.min(min[i], acc.min[i]);
        max[i] = Math.max(max[i], acc.max[i]);
      }
    }
  }
  return Number.isFinite(min[0]) ? { min, max, lado: max.map((v, i) => v - min[i]) } : null;
}

function huesos(gltf) {
  const nombres = [];
  for (const skin of gltf.skins ?? []) {
    for (const j of skin.joints ?? []) {
      const n = gltf.nodes?.[j];
      if (n?.name) nombres.push(n.name);
    }
  }
  return nombres;
}

function buscarHuesoCabeza(nombres) {
  const limpio = (s) => s.toLowerCase().replace(/^mixamorig|^bip\d*_?|^def[-_]|^b_|[\s.-]/g, "");
  const exactas = ["head", "headtop", "headend", "headtopend", "neck", "cabeza"];
  const map = new Map(nombres.map((n) => [limpio(n), n]));
  for (const clave of exactas) if (map.has(clave)) return { hueso: map.get(clave), via: "exacto" };
  const parcial = nombres.find((n) => /head|cabeza/.test(limpio(n)));
  return parcial ? { hueso: parcial, via: "parcial" } : { hueso: null, via: "ninguno" };
}

/** Solo sirve en archivos sin comprimir: lee los float32 crudos del buffer. */
function leerGeometria(gltf, bin) {
  const posiciones = [];
  const indices = [];
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const pos = gltf.accessors?.[prim.attributes?.POSITION];
      if (!pos) continue;
      const view = gltf.bufferViews?.[pos.bufferView];
      const base = (view.byteOffset ?? 0) + (pos.byteOffset ?? 0);
      const stride = view.byteStride ?? 12;
      for (let i = 0; i < pos.count; i += 1) {
        const o = base + i * stride;
        posiciones.push(bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8));
      }
      const idx = prim.indices != null ? gltf.accessors[prim.indices] : null;
      if (idx) {
        const iv = gltf.bufferViews?.[idx.bufferView];
        const ib = (iv.byteOffset ?? 0) + (idx.byteOffset ?? 0);
        const grande = iv.byteStride === undefined || iv.byteStride === 4;
        for (let i = 0; i < idx.count; i += 1) {
          indices.push(grande ? bin.readUInt32LE(ib + i * 4) : bin.readUInt16LE(ib + i * 2));
        }
      }
    }
  }
  return { posiciones, indices };
}

function perfilAltura({ posiciones }, filas = 34) {
  if (posiciones.length === 0) return [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < posiciones.length; i += 3) {
    minY = Math.min(minY, posiciones[i]);
    maxY = Math.max(maxY, posiciones[i]);
  }
  const bandas = Array.from({ length: filas }, () => ({
    n: 0,
    fondo: 0,
    minX: Infinity,
    maxX: -Infinity,
  }));
  for (let i = 0; i < posiciones.length; i += 3) {
    const y = posiciones[i + 1];
    const fila = Math.min(filas - 1, Math.max(0, Math.floor(((y - minY) / (maxY - minY)) * filas)));
    const b = bandas[fila];
    b.n += 1;
    b.fondo = Math.max(b.fondo, Math.abs(posiciones[i + 2]));
    b.minX = Math.min(b.minX, posiciones[i]);
    b.maxX = Math.max(b.maxX, posiciones[i]);
  }
  return bandas.map((b, i) => ({
    y: Math.round((minY + ((maxY - minY) * (i + 0.5)) / filas) * 100) / 100,
    n: b.n,
    ancho: Math.round(Math.max(Math.abs(b.minX), Math.abs(b.maxX)) * 1000) / 1000,
    fondo: Math.round(b.fondo * 1000) / 1000,
  }));
}

function resumen({ ruta, bytes }) {
  const kb = bytes / 1024;
  const salida = {
    archivo: ruta,
    mb: Math.round((bytes / 1024 / 1024) * 100) / 100,
    kb: Math.round(kb),
    problemas: [],
  };

  try {
    const buffer = readFileSync(join(RAIZ, ruta));
    const { json, bin } = leerGlb(buffer);
    const nombres = huesos(json);
    const cabeza = buscarHuesoCabeza(nombres);
    const ext = json.extensionsUsed || [];
    // Con Meshopt/cuantizacion el min/max del JSON esta en el dominio comprimido y
    // la caja salefalsea. Para medir de verdad hay que correr `npm run avatares:cabeza`.
    const comprimido = ext.indexOf("KHR_mesh_quantization") >= 0 || ext.indexOf("EXT_meshopt_compression") >= 0;
    const caja3 = comprimido ? null : caja(json);
    const geometria = MODO_PERFIL && !comprimido ? leerGeometria(json, bin) : null;

    const d = {
      generador: json.asset?.generator ?? "desconocido",
      version: json.asset?.version ?? "?",
      nodos: (json.nodes ?? []).length,
      mallas: (json.meshes ?? []).length,
      triangulos: contarTriangulos(json),
      materiales: (json.materials ?? []).length,
      texturas: (json.images ?? []).length,
      bytesTextura: (json.images ?? []).reduce((s, i) => s + (i.byteLength ?? 0), 0),
      skins: (json.skins ?? []).length,
      huesos: nombres.length,
      animaciones: (json.animations ?? []).map((a) => a.name ?? "(sin nombre)"),
      comprimido: comprimido,
      caja: caja3
        ? {
            alto: Math.round(caja3.lado[1] * 1000) / 1000,
            ancho: Math.round(caja3.lado[0] * 1000) / 1000,
            fondo: Math.round(caja3.lado[2] * 1000) / 1000,
            yMin: Math.round(caja3.min[1] * 1000) / 1000,
          }
        : null,
      huesoCabeza: cabeza.hueso,
      huesoCabezaVia: cabeza.via,
    };
    salida.datos = d;

    if (bytes > UMBRAL_MOVIL_KB * 1024) {
      salida.problemas.push(`pesa ${salida.mb} MB, supera el presupuesto móvil de ${UMBRAL_MOVIL_KB} KB`);
    }
    if (d.triangulos > 60000) salida.problemas.push(`${d.triangulos} triángulos, baja a 40k o menos`);
    if (d.texturas === 0) salida.problemas.push("sin texturas: se verá liso");
    if (d.skins === 0 && d.huesos === 0) salida.problemas.push("sin esqueleto: no se puede animar (se usará el avatar procedural)");
    // El pelo ya no se ancla por hueso sino con detectarCabeza(), asi que la falta de
    // hueso de cabeza no es un problema: se valida con `npm run avatares:cabeza`.
    if (d.caja && d.caja.alto > d.caja.ancho * 2.2 && d.caja.fondo > d.caja.ancho * 2.2) {
      salida.problemas.push("orientación dudosa: verificá que Y sea el eje vertical");
    }
    if (d.caja && d.caja.yMin > -0.05 && d.caja.alto > 1) {
      salida.problemas.push(`el origen no está a los pies (yMin=${d.caja.yMin}); hay que recentrar`);
    }

    if (geometria) {
      const bandas = perfilAltura(geometria);
      const maxN = Math.max(...bandas.map((b) => b.n), 1);
      console.log(`\n   y      vértices   ancho    fondo`);
      for (const banda of bandas) {
        const barra = "#".repeat(Math.round((banda.n / maxN) * 40));
        console.log(
          `   ${String(banda.y).padStart(6)}  ${String(banda.n).padStart(8)}   ${String(banda.ancho).padStart(6)}  ${String(banda.fondo).padStart(6)}  ${barra}`,
        );
      }
    }
  } catch (error) {
    salida.problemas.push(`no se pudo leer: ${error.message}`);
  }

  return salida;
}

function recorrer(dir, base = "") {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const ruta = join(dir, entry);
    if (statSync(ruta).isDirectory()) found.push(...recorrer(ruta, base ? `${base}/${entry}` : entry));
    else if (extname(entry).toLowerCase() === ".glb") found.push(base ? `${base}/${entry}` : entry);
  }
  return found;
}

const archivos = recorrer(RAIZ).sort();
if (archivos.length === 0) {
  console.log(`Sin .glb en ${RAIZ}`);
  process.exit(0);
}

let total = 0;
let conProblemas = 0;
for (const archivo of archivos) {
  const bytes = statSync(join(RAIZ, archivo)).size;
  total += bytes;
  const r = resumen({ ruta: archivo, bytes });
  if (r.problemas.length) conProblemas += 1;
  console.log(`\n── ${r.archivo}  ·  ${r.mb} MB  ·  ${r.kb} KB`);
  const d = r.datos;
  if (d) {
    console.log(
      `   mallas ${d.mallas} · triángulos ${d.triangulos} · materiales ${d.materiales} · texturas ${d.texturas}`,
    );
    const anim = d.animaciones.length ? d.animaciones.join(", ") : "—";
    console.log(`   skins ${d.skins} · huesos ${d.huesos} · animaciones ${anim}${d.comprimido ? " · meshopt/cuantizado" : ""}`);
    if (d.comprimido) {
      console.log(`   caja real: usá \`npm run avatares:cabeza\` (el JSON está comprimido)`);
    } else {
      console.log(`   caja alto ${d.caja?.alto} ancho ${d.caja?.ancho} fondo ${d.caja?.fondo} · yMin ${d.caja?.yMin}`);
      console.log(`   hueso cabeza: ${d.huesoCabeza ?? "—"} (${d.huesoCabezaVia})`);
    }
  }
  for (const p of r.problemas) console.log(`   ⚠ ${p}`);
}

console.log(`\n${archivos.length} archivo(s), ${(total / 1024 / 1024).toFixed(2)} MB total, ${conProblemas} con observaciones.`);
console.log(`Presupuesto móvil: ${UMBRAL_MOVIL_KB} KB por archivo.`);
