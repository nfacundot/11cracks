/**
 * Genera public/models/avatares/manifest.json a partir de los .glb optimizados.
 *
 * Los originales viven en assets-3d/avatares (fuera de public, no se sirven).
 * Solo se publica lo que esta en public/models/avatares/web.
 *
 * Uso: node scripts/generar-manifest-avatares.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

const RAIZ = process.argv[2] ?? process.cwd();
const ORIGENALES = join(RAIZ, "assets-3d", "avatares");
const BASE_PUBLICA = join(RAIZ, "public", "models", "avatares");
const WEB = join(BASE_PUBLICA, "web");
const SALIDA = join(BASE_PUBLICA, "manifest.json");
const CONFIG = join(ORIGENALES, "avatares.config.json");

/** tipo por defecto segun la carpeta donde vive el original. */
const TIPOS_POR_CARPETA = {
  masc: { tipo: "cuerpo", genero: "masculino", ocupa: ["cuerpo"] },
  fem: { tipo: "cuerpo", genero: "femenino", ocupa: ["cuerpo"] },
  cuerpo: { tipo: "cuerpo", genero: "todos", ocupa: ["cuerpo"] },
  // Los cabellos se publican ya recortados a la cabeza: ocupan solo "cabello".
  // Se deja "todos" en genero porque el recorte normaliza el espacio de cabeza y
  // el ajuste se hace en runtime contra el ancla del cuerpo elegido.
  cabello_m: { tipo: "cabello", genero: "todos", ocupa: ["cabello"] },
  cabello_f: { tipo: "cabello", genero: "todos", ocupa: ["cabello"] },
  cabello: { tipo: "cabello", genero: "todos", ocupa: ["cabello"] },
  prendas: { tipo: "prenda", genero: "todos", ocupa: ["prenda"] },
  accesorios: { tipo: "accesorio", genero: "todos", ocupa: ["accesorio"] },
  animaciones: { tipo: "animacion", genero: "todos", ocupa: [] },
};

function leerGlb(buffer) {
  const total = buffer.readUInt32LE(8);
  const length = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + length).toString("utf8"));
  if (total <= 0) throw new Error("GLB invalido");
  return json;
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

function listarGlb(dir, base = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const ruta = join(dir, entry);
    if (statSync(ruta).isDirectory()) out.push(...listarGlb(ruta, base ? `${base}/${entry}` : entry));
    else if (extname(entry).toLowerCase() === ".glb") out.push(base ? `${base}/${entry}` : entry);
  }
  return out;
}

function idDesdeRuta(relativo) {
  return relativo
    .replace(/\.glb$/i, "")
    .replace(/[\\/]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function nombreBonito(relativo) {
  return idDesdeRuta(relativo)
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

const nombreBase = (ruta) => ruta.split("/").pop() ?? ruta;
const manual = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")) : {};

// El id se deriva del nombre del archivo original para que cambiar de carpeta no lo rompa.
const porNombre = new Map();
for (const [relativo, meta] of Object.entries(manual)) {
  porNombre.set(idDesdeRuta(nombreBase(relativo)), meta);
}

const assets = [];
const originales = listarGlb(ORIGENALES);

for (const archivo of listarGlb(WEB).sort()) {
  const id = idDesdeRuta(archivo);
  const buffer = readFileSync(join(WEB, archivo));
  const gltf = leerGlb(buffer);

  // Busca el original con el mismo nombre de archivo para heredar tipo/genero/slots.
  const original = originales.find((r) => idDesdeRuta(nombreBase(r)) === id);
  const carpeta = original
    ? original.split("/")[0]
    : (archivo.split("/").length > 1 ? archivo.split("/").slice(-2, -1)[0] : "");
  const base = TIPOS_POR_CARPETA[carpeta] ?? { tipo: "cuerpo", genero: "todos", ocupa: ["cuerpo"] };
  const meta = porNombre.get(id) ?? {};

  assets.push({
    id,
    tipo: meta.tipo ?? base.tipo,
    genero: meta.genero ?? base.genero,
    nombre: meta.nombre ?? nombreBonito(archivo),
    ocupa: meta.ocupa ?? base.ocupa,
    archivo: `web/${archivo}`,
    kb: Math.round(buffer.length / 1024),
    triangulos: contarTriangulos(gltf),
   animable: (gltf.animations ?? []).length > 0,
  });
}

const manifiesto = {
  version: 1,
  base: "/models/avatares",
  actualizado: new Date().toISOString().slice(0, 10),
  assets,
};

writeFileSync(SALIDA, `${JSON.stringify(manifiesto, null, 2)}\n`, "utf8");

console.log(`manifest.json escrito con ${assets.length} asset(s).`);
for (const a of assets) {
  console.log(`  ${a.id.padEnd(14)} ${a.tipo.padEnd(9)} ${a.genero.padEnd(11)} ${String(a.kb).padStart(5)} KB  ${String(a.triangulos).padStart(7)} tri  ocupa=${a.ocupa.join("+")}`);
}
const originalesFaltan = originales.filter(
  (r) => !assets.some((a) => a.id === idDesdeRuta(nombreBase(r))),
);
if (originalesFaltan.length) {
  console.log(`\nSin equivalente optimizado en web/ (optimizalos):`);
  for (const r of originalesFaltan) console.log(`  ${r}`);
}