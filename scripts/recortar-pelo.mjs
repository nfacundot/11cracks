/**
 * Recorta el pelo de un personaje completo de Meshy y lo publica como asset
 * independiente del slot "cabello".
 *
 * Los export de Meshy (cab1.glb, cab2.glb) son personajes enteros en T-pose, sin
 * esqueleto, con millones de triangulos y el pelo horneado en la misma textura que
 * el cuerpo. Este script:
 *
 *   1. Detecta la cabeza con la misma proporcion corporal que `detectarCabeza()`
 *      (7.5 cabezas) y refina el eje con la mediana de los vertices de esa banda.
 *   2. Descarta todo lo que no cae en una caja de "espacio de cabeza" (origen en el
 *      centro de la cabeza, +Y arriba, +Z al frente, 1 = mitad del ancho de la
 *      cabeza). Asi el recorte descarta los brazos de la T-pose.
 *   3. Reescribe el GLB con solo esa geometria, conservando POSITION, NORMAL,
 *      TEXCOORD_0 y las texturas: el pelo sigue viendo su horneado original.
 *
 * El asset resultante lo ancla `FiguraAvatar` con el mismo codigo que el pelo
 * procedural (escala = radioX de la cabeza del cuerpo, posicion = su centro), asi
 * que sirve sobre cualquier cuerpo del manifiesto.
 *
 * Uso:
 *   node --max-old-space-size=8192 scripts/recortar-pelo.mjs [opciones] <entrada.glb...>
 *
 * Opciones:
 *   --cuerpo <ruta>  GLB de cuerpo calvo que da el ancla de cabeza de referencia.
 *                    Sin esto se autodetecta, pero en personajes de T-pose los brazos
 *                    contaminan la banda y el recorte sale mal.
 *   --salida <dir>   Carpeta donde escribir los .glb (default public/models/avatares/web/_pelo)
 *   --caja x:y:z     Semiejes del crop en espacio de cabeza (default 1.6:1.0:1.9)
 *   --suelo <y>      Y minimo del crop en espacio de cabeza (default -2.0)
 *   --techo <y>      Y maximo del crop en espacio de cabeza (default 1.9)
 *   --info           Solo diagnostico: no escribe nada
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const CABECAS = 7.5;

const BANDERAS = new Set(["info"]);

const args = process.argv.slice(2);
const flags = new Map();
const entradas = [];
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a.startsWith("--")) {
    const clave = a.slice(2);
    const siguiente = args[i + 1];
    if (BANDERAS.has(clave) || siguiente === undefined || siguiente.startsWith("--")) {
      flags.set(clave, true);
    } else {
      flags.set(clave, siguiente);
      i += 1;
    }
  } else entradas.push(a);
}

const SALIDA = flags.get("salida") ?? "public/models/avatares/web/_pelo";
const SOLO_INFO = flags.get("info") === true;
const CUERPO = flags.get("cuerpo") ?? null;
const [CX, CZ] = String(flags.get("caja") ?? "1.6:1.9").split(":").map(Number);
const SUELO = Number(flags.get("suelo") ?? -2.0);
const TECHO = Number(flags.get("techo") ?? 1.9);

// ── Lectura de GLB ────────────────────────────────────────────────────────────

function leerGlb(ruta) {
  const buffer = readFileSync(ruta);
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error(`${ruta} no es un GLB`);
  const total = buffer.readUInt32LE(8);
  let off = 12;
  let json = null;
  let bin = null;
  while (off < total) {
    const len = buffer.readUInt32LE(off);
    const type = buffer.readUInt32LE(off + 4);
    const data = buffer.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
    else if (type === 0x004e4942) bin = data;
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  if (!json || !bin) throw new Error(`${ruta} incompleto`);
  return { json, bin };
}

/** Lee un accessor a un TypedArray del tamaño correcto segun componentType. */
function leerAccessor(gltf, bin, indice) {
  const acc = gltf.accessors[indice];
  const view = gltf.bufferViews[acc.bufferView];
  const base = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const nComp = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type] ?? 3;
  const total = acc.count * nComp;
  let arr;
  if (acc.componentType === 5126) {
    arr = new Float32Array(total);
    for (let i = 0; i < total; i += 1) arr[i] = bin.readFloatLE(base + i * 4);
  } else if (acc.componentType === 5125) {
    arr = new Uint32Array(total);
    for (let i = 0; i < total; i += 1) arr[i] = bin.readUInt32LE(base + i * 4);
  } else if (acc.componentType === 5123) {
    arr = new Uint16Array(total);
    for (let i = 0; i < total; i += 1) arr[i] = bin.readUInt16LE(base + i * 2);
  } else if (acc.componentType === 5121) {
    arr = new Uint8Array(total);
    for (let i = 0; i < total; i += 1) arr[i] = bin.readUInt8(base + i);
  } else throw new Error(`componentType ${acc.componentType} no soportado`);
  return { datos: arr, count: acc.count };
}

/** Triangulos como Uint32Array, resolviendo el caso sin indices. */
function triangulos(gltf, bin, prim, nVerts) {
  if (prim.indices != null) {
    const { datos } = leerAccessor(gltf, bin, prim.indices);
    const out = new Uint32Array(datos.length);
    out.set(datos);
    return out;
  }
  const out = new Uint32Array(nVerts);
  for (let i = 0; i < nVerts; i += 1) out[i] = i;
  return out;
}

// ── Deteccion de cabeza (misma proporcion que src/lib/avatar3d/avatares/cabeza.ts) ──

function mediana(arreglo) {
  const copia = Array.from(arreglo).sort((a, b) => a - b);
  return copia[Math.floor(copia.length / 2)];
}

/**
 * Devuelve el ancla de la cabeza en el espacio del archivo: centro y semiancho
 * medido sobre la banda superior. Los brazos de la T-pose caen fuera del radio.
 */
function detectarCabeza(pos, n) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const y = pos[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const alto = maxY - minY;
  const altoCabeza = alto / CABECAS;
  const yCentro = maxY - altoCabeza * 0.52;
  const ventana = altoCabeza * 0.35;
  const radioMax = alto * 0.13;

  let sel = [];
  for (let i = 0; i < n; i += 1) {
    if (Math.abs(pos[i * 3 + 1] - yCentro) <= ventana) sel.push(i);
  }
  for (let vuelta = 0; vuelta < 3 && sel.length; vuelta += 1) {
    const ejeX = mediana(sel.map((i) => pos[i * 3]));
    const ejeZ = mediana(sel.map((i) => pos[i * 3 + 2]));
    const cerca = [];
    for (const i of sel) {
      const dx = pos[i * 3] - ejeX;
      const dz = pos[i * 3 + 2] - ejeZ;
      if (dx * dx + dz * dz <= radioMax * radioMax) cerca.push(i);
    }
    if (cerca.length >= 12) sel = cerca;
  }

  const cx = mediana(sel.map((i) => pos[i * 3]));
  const cz = mediana(sel.map((i) => pos[i * 3 + 2]));
  let radioX = 0;
  let radioZ = 0;
  for (const i of sel) {
    radioX = Math.max(radioX, Math.abs(pos[i * 3] - cx));
    radioZ = Math.max(radioZ, Math.abs(pos[i * 3 + 2] - cz));
  }
  return {
    centro: [cx, yCentro, cz],
    radioX: radioX || altoCabeza * 0.45,
    radioZ,
    alto,
    minY,
    maxY,
    altoCabeza,
  };
}

const alinear = (n) => (n + 3) & ~3;

/** Escribe un Float32Array en el buffer destino a partir de `off`. */
function escribirFloats(outBin, off, fuente) {
  for (let i = 0; i < fuente.length; i += 1) outBin.writeFloatLE(fuente[i], off + i * 4);
}

/** Empaqueta los bytes de textura del BIN original dentro de un destino. */
/** Arma el contenedor GLB (cabecera + chunk JSON + chunk BIN). */
function armarGlb(json, bin) {
  const jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
  // El spec de glTF exige que el relleno del chunk JSON sea de espacios (0x20).
  // Con ceros, JSON.parse y varios validadores tiran error.
  const rellenoJson = (4 - (jsonBuf.length % 4)) % 4;
  const jsonPadded = rellenoJson
    ? Buffer.concat([jsonBuf, Buffer.alloc(rellenoJson, 0x20)])
    : jsonBuf;
  const binPadded = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
  const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length;

  const cabecera = Buffer.alloc(12);
  cabecera.writeUInt32LE(0x46546c67, 0);
  cabecera.writeUInt32LE(2, 4);
  cabecera.writeUInt32LE(total, 8);

  const cJson = Buffer.alloc(8);
  cJson.writeUInt32LE(jsonPadded.length, 0);
  cJson.writeUInt32LE(0x4e4f534a, 4);

  const cBin = Buffer.alloc(8);
  cBin.writeUInt32LE(binPadded.length, 0);
  cBin.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([cabecera, cJson, jsonPadded, cBin, binPadded]);
}

// ── Recorte ───────────────────────────────────────────────────────────────────

function recortar(gltf, bin, ruta, nombre, referencia) {
  const prim = gltf.meshes[0].primitives[0];
  const pos = leerAccessor(gltf, bin, prim.attributes.POSITION).datos;
  const n = pos.length / 3;
  const nor = prim.attributes.NORMAL != null ? leerAccessor(gltf, bin, prim.attributes.NORMAL).datos : null;
  const uv = prim.attributes.TEXCOORD_0 != null ? leerAccessor(gltf, bin, prim.attributes.TEXCOORD_0).datos : null;
  const idx = triangulos(gltf, bin, prim, n);

  // El ancla viene del cuerpo calvo: los personajes de T-pose autodetectan mal.
  // `escala` iguala la altura de este personaje con la del cuerpo de referencia
  // para que ambos compartan espacio, ya que `FiguraAvatar` los ancla igual.
  const propio = detectarCabeza(pos, n);
  const ancla = referencia ?? propio;
  const escala = referencia ? referencia.alto / propio.alto : 1;
  const cx = ancla.centro[0];
  const cy = ancla.centro[1];
  const cz = ancla.centro[2];

  // Unidad de salida: la cabeza del PROPIO personaje del pelo, puesta en el espacio
  // del cuerpo de referencia. Importa que NO sea `radioX` del cuerpo: los personajes
  // de Meshy no comparten proporciones de cabeza, y al normalizar por la referencia
  // un pelo cuyo personaje tiene la cabeza mas pequena salia al 0.78x del ancho de la
  // cabeza de destino, es decir, enterrado dentro del craneo e invisible. Con la
  // cabeza propia, 1 = su propio semi-ancho, asi que al pintar queda ~1.0x del
  // craneo y ESPESOR_PELO decide cuanto sobresale.
  const unidadX = propio.radioX * escala;

  // A espacio de cabeza: origen en el centro, 1 = semi-ancho de la cabeza.
  const dentro = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const hx = (pos[i * 3] * escala - cx) / unidadX;
    const hy = (pos[i * 3 + 1] * escala - cy) / unidadX;
    const hz = (pos[i * 3 + 2] * escala - cz) / unidadX;
    dentro[i] = Math.abs(hx) <= CX && hy >= SUELO && hy <= TECHO && Math.abs(hz) <= CZ ? 1 : 0;
  }

  // Solo se conservan triangulos con los tres vertices dentro: sin bordes rotos.
  const remap = new Int32Array(n).fill(-1);
  const nuevoIdx = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t];
    const b = idx[t + 1];
    const c = idx[t + 2];
    if (!dentro[a] || !dentro[b] || !dentro[c]) continue;
    for (const v of [a, b, c]) if (remap[v] === -1) remap[v] = -2;
    nuevoIdx.push(a, b, c);
  }

  let usados = 0;
  for (let i = 0; i < n; i += 1) if (remap[i] === -2) remap[i] = usados++;

  const stats = {
    archivo: basename(ruta),
    verticesOriginales: n,
    triangulosOriginales: idx.length / 3,
    verticesRecortados: usados,
    triangulosRecortados: nuevoIdx.length / 3,
    ancla,
    anclaPropia: propio,
    escala,
  };

  if (SOLO_INFO || usados === 0) return stats;

  // ── Geometria nueva en espacio de cabeza ───────────────────────────────────
  const nV = usados;
  const posNuevo = new Float32Array(nV * 3);
  const norNuevo = nor ? new Float32Array(nV * 3) : null;
  const uvNuevo = uv ? new Float32Array(nV * 2) : null;
  const minH = [Infinity, Infinity, Infinity];
  const maxH = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < n; i += 1) {
    const d = remap[i];
    if (d < 0) continue;
    const hx = (pos[i * 3] * escala - cx) / unidadX;
    const hy = (pos[i * 3 + 1] * escala - cy) / unidadX;
    const hz = (pos[i * 3 + 2] * escala - cz) / unidadX;
    posNuevo[d * 3] = hx;
    posNuevo[d * 3 + 1] = hy;
    posNuevo[d * 3 + 2] = hz;
    for (let a = 0; a < 3; a += 1) {
      const v = posNuevo[d * 3 + a];
      if (v < minH[a]) minH[a] = v;
      if (v > maxH[a]) maxH[a] = v;
    }
    if (norNuevo) {
      norNuevo[d * 3] = nor[i * 3];
      norNuevo[d * 3 + 1] = nor[i * 3 + 1];
      norNuevo[d * 3 + 2] = nor[i * 3 + 2];
    }
    if (uvNuevo) {
      uvNuevo[d * 2] = uv[i * 2];
      uvNuevo[d * 2 + 1] = uv[i * 2 + 1];
    }
  }
  stats.cajaCabeza = { min: minH, max: maxH };

  // ── Empaquetado: [geometria nueva][texturas originales] ─────────────────────
  const bytesPos = nV * 3 * 4;
  const bytesNor = norNuevo ? bytesPos : 0;
  const bytesUv = uvNuevo ? nV * 2 * 4 : 0;
  const bytesIdx = nuevoIdx.length * 4;
  const offPos = 0;
  const offNor = offPos + bytesPos;
  const offUv = offNor + bytesNor;
  const offIdx = offUv + bytesUv;
  const baseTextura = alinear(offIdx + bytesIdx);

  // Solo se copia del BIN original el tramo que ocupan las texturas.
  const vistasTextura = [...new Set((gltf.images ?? []).map((i) => i.bufferView).filter((v) => v != null))];
  let iniTextura = Infinity;
  let finTextura = 0;
  for (const vi of vistasTextura) {
    const v = gltf.bufferViews[vi];
    const off = v.byteOffset ?? 0;
    if (off < iniTextura) iniTextura = off;
    if (off + v.byteLength > finTextura) finTextura = off + v.byteLength;
  }
  if (!Number.isFinite(iniTextura)) {
    iniTextura = 0;
    finTextura = 0;
  }
  const deltaTextura = baseTextura - iniTextura;

  const outBin = Buffer.alloc(baseTextura + (finTextura - iniTextura));
  escribirFloats(outBin, offPos, posNuevo);
  if (norNuevo) escribirFloats(outBin, offNor, norNuevo);
  if (uvNuevo) escribirFloats(outBin, offUv, uvNuevo);
  const idxBuf = Buffer.alloc(bytesIdx);
  for (let i = 0; i < nuevoIdx.length; i += 1) idxBuf.writeUInt32LE(remap[nuevoIdx[i]], i * 4);
  outBin.set(idxBuf, offIdx);
  bin.copy(outBin, baseTextura, iniTextura, finTextura);

  // ── JSON de salida ────────────────────────────────────────────────────────
  const bufferViews = [];
  const acceso = (indice, componentType, count, type, min, max) => ({
    bufferView: indice,
    componentType,
    count,
    type,
    ...(min ? { min } : {}),
    ...(max ? { max } : {}),
  });

  bufferViews.push({ buffer: 0, byteOffset: offPos, byteLength: bytesPos, target: 34962 });
  const atributos = { POSITION: bufferViews.length - 1 };
  const accessors = [acceso(atributos.POSITION, 5126, nV, "VEC3", minH, maxH)];
  if (norNuevo) {
    bufferViews.push({ buffer: 0, byteOffset: offNor, byteLength: bytesNor, target: 34962 });
    atributos.NORMAL = bufferViews.length - 1;
    accessors.push(acceso(atributos.NORMAL, 5126, nV, "VEC3"));
  }
  if (uvNuevo) {
    bufferViews.push({ buffer: 0, byteOffset: offUv, byteLength: bytesUv, target: 34962 });
    atributos.TEXCOORD_0 = bufferViews.length - 1;
    accessors.push(acceso(atributos.TEXCOORD_0, 5126, nV, "VEC2"));
  }
  bufferViews.push({ buffer: 0, byteOffset: offIdx, byteLength: bytesIdx, target: 34963 });
  const accesoIndices = accessors.length;
  accessors.push({ bufferView: bufferViews.length - 1, componentType: 5125, count: nuevoIdx.length, type: "SCALAR" });

  // Cada textura original se copia a su propio bufferView. `vistasTextura` fija
  // el orden: el indice i de esa lista es el indice de `images[i]`, asi que
  // `textures[].source` (que apunta a `images`, no a `bufferViews`) se resuelve
  // con la posicion de la vista original dentro de la lista.
  const indiceImagen = new Map();
  vistasTextura.forEach((vi, i) => {
    const v = gltf.bufferViews[vi];
    bufferViews.push({ ...v, buffer: 0, byteOffset: (v.byteOffset ?? 0) + deltaTextura });
    indiceImagen.set(vi, i);
  });

  const nuevoJson = {
    asset: { version: "2.0", generator: "recortar-pelo.mjs" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: nombre }],
    meshes: [
      { name: nombre, primitives: [{ attributes: atributos, indices: accesoIndices, material: 0, mode: 4 }] },
    ],
    materials: gltf.materials ?? [],
    textures: (gltf.textures ?? []).map((t) => ({
      ...t,
      source: indiceImagen.get(gltf.images[t.source]?.bufferView),
    })),
    images: vistasTextura.map((vi, i) => ({
      mimeType: gltf.images[vistasTextura.indexOf(vi)].mimeType ?? "image/jpeg",
      bufferView: bufferViews.length - vistasTextura.length + i,
    })),
    samplers: gltf.samplers ?? [],
    accessors,
    bufferViews,
    buffers: [{ byteLength: outBin.length }],
  };

  mkdirSync(SALIDA, { recursive: true });
  const salida = join(SALIDA, `${nombre}.glb`);
  const glb = armarGlb(nuevoJson, outBin);
  writeFileSync(salida, glb);
  stats.salida = salida;
  stats.kb = Math.round(glb.length / 102.4) / 10;
  return stats;
}

if (entradas.length === 0) {
  console.error(
    "Falta el .glb de entrada. Ej: node --max-old-space-size=8192 scripts/recortar-pelo.mjs assets-3d/avatares/cabello_m/cab1.glb",
  );
  process.exit(1);
}

console.log(`Espacio de cabeza: |x|<=${CX}  y ${SUELO}..${TECHO}  |z|<=${CZ}`);

let referencia = null;
if (CUERPO) {
  const { json, bin } = leerGlb(CUERPO);
  const prim = json.meshes[0].primitives[0];
  const pos = leerAccessor(json, bin, prim.attributes.POSITION).datos;
  referencia = detectarCabeza(pos, pos.length / 3);
  console.log(
    `Ancla de referencia (${basename(CUERPO)}): alto ${referencia.alto.toFixed(4)}  centro (${referencia.centro.map((v) => v.toFixed(4)).join(", ")})  radioX ${referencia.radioX.toFixed(4)}`,
  );
} else {
  console.warn("Aviso: sin --cuerpo el ancla se autodetecta. En personajes de T-pose los brazos contaminan la banda.");
}

for (const ruta of entradas) {
  const { json, bin } = leerGlb(ruta);
  const nombre = basename(ruta).replace(/\.glb$/i, "");
  const s = recortar(json, bin, ruta, nombre, referencia);
  const a = s.ancla;
  console.log(`\n── ${s.archivo}`);
  console.log(
    `   alto ${a.alto.toFixed(4)}  centro (${a.centro.map((v) => v.toFixed(4)).join(", ")})  radioX ${a.radioX.toFixed(4)}  escala aplicada ${s.escala.toFixed(4)}`,
  );
  console.log(
    `   ${s.triangulosRecortados} de ${s.triangulosOriginales} triangulos  ·  ${s.verticesRecortados} de ${s.verticesOriginales} vertices`,
  );
  if (s.cajaCabeza) {
    console.log(
      `   caja en espacio de cabeza: x ${s.cajaCabeza.min[0].toFixed(2)}..${s.cajaCabeza.max[0].toFixed(2)}  y ${s.cajaCabeza.min[1].toFixed(2)}..${s.cajaCabeza.max[1].toFixed(2)}  z ${s.cajaCabeza.min[2].toFixed(2)}..${s.cajaCabeza.max[2].toFixed(2)}`,
    );
  }
  if (s.salida) console.log(`   → ${s.salida}  (${s.kb} KB)`);
  else if (s.verticesRecortados === 0) console.log("   (crop vacio)");
}