/**
 * Prueba de humo del runtime: instancia la FiguraAvatar real contra los .glb
 * publicados y comprueba que el cuerpo y el pelo GLB llegan a montarse.
 *
 * FiguraAvatar (igual que la app) pide rutas absolutas del sitio, que en Node no
 * resuelven, asi que aqui se monta un servidor estatico sobre public/ y se
 * parchea fetch para traducirlas.
 *
 * El parche va antes de importar three a proposito: en ESM los import se
 * evaluan antes que cualquier sentencia del cuerpo del modulo, y FileLoader de
 * three consulta el binding global de fetch al cargarse. Un import estatico de
 * three dejaria el parche sin efecto.
 *
 * Uso: npx tsx scripts/verificar-runtime-pelo.mjs
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const RAIZ = "public";
const TIPOS = {
  ".glb": "model/gltf-binary",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
};

const servidor = createServer(async (req, res) => {
  try {
    const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(
      /^(\.\.[/\\])+/,
      "",
    );
    const bytes = await readFile(join(RAIZ, ruta));
    res.writeHead(200, {
      "content-type": TIPOS[extname(ruta)] ?? "application/octet-stream",
      "content-length": bytes.byteLength,
    });
    res.end(bytes);
  } catch {
    res.writeHead(404).end("no");
  }
});

await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${servidor.address().port}`;

// FileLoader de three hace `new Request(url)` antes de llamar a fetch, y Node
// lanza "Failed to parse URL" al construir la Request con una ruta relativa.
// Parchear fetch no alcanza: hay que parchear Request.
const RequestReal = globalThis.Request;
globalThis.Request = class extends RequestReal {
  constructor(entrada, init) {
    super(
      typeof entrada === "string" && entrada.startsWith("/") ? base + entrada : entrada,
      init,
    );
  }
};

// three y el decodificador meshopt tocan `self`, que solo existe en navegador.
if (typeof globalThis.self === "undefined") globalThis.self = globalThis;

// three emite el progreso con ProgressEvent al leer la respuesta; Node no lo trae.
if (typeof globalThis.ProgressEvent === "undefined") {
  globalThis.ProgressEvent = class ProgressEvent extends Event {
    constructor(tipo, init = {}) {
      super(tipo);
      this.lengthComputable = Boolean(init.lengthComputable);
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
    }
  };
}

const fetchReal = globalThis.fetch;
globalThis.fetch = (entrada, init) => {
  if (typeof entrada === "string" && entrada.startsWith("/")) return fetchReal(base + entrada, init);
  if (entrada instanceof URL) return fetchReal(new URL(entrada.href, base), init);
  if (entrada && typeof entrada === "object" && entrada.url) {
    return fetchReal(new RequestReal(new URL(entrada.url, base), entrada), init);
  }
  return fetchReal(entrada, init);
};

// Recién ahora three y la clase de la app.
const THREE = await import("three");
const { FiguraAvatar, cargarEscena } = await import(
  "../src/lib/avatar3d/avatares/figura"
);
const { cargarManifiesto } = await import("../src/lib/avatar3d/avatares/registro");
const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Traduce una excepcion de three a algo legible. */
function motivo(e) {
  if (!e) return "desconocido";
  if (typeof e === "string") return e;
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return JSON.stringify(e);
}

async function probarCargaDirecta(url) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  try {
    const gltf = await loader.loadAsync(url);
    let mallas = 0;
    gltf.scene.traverse((o) => {
      if (o.isMesh) mallas += 1;
    });
    return `OK (${mallas} mallas)`;
  } catch (e) {
    return `FALLA -> ${motivo(e)}`;
  }
}

function meshesDe(slot) {
  const info = [];
  slot.traverse((o) => {
    if (!o.isMesh) return;
    const vert = o.geometry.attributes.position?.count ?? 0;
    if (vert <= 200) return;
    let visible = true;
    for (let p = o; p; p = p.parent) if (!p.visible) visible = false;
    const caja = new THREE.Box3().setFromObject(o);
    info.push({ visible, vert, caja });
  });
  return info;
}

async function probar(cfg, etiqueta) {
  const figura = new FiguraAvatar({ config: cfg, height: 2 });
  // Varias pasadas: la primera resuelve el manifiesto, la siguiente aplica el
  // pelo sobre el cuerpo ya normalizado.
  for (const espera of [200, 500, 1000]) {
    await esperar(espera);
    figura.setConfig(cfg);
  }
  await esperar(700);
  figura.object3D.updateMatrixWorld(true);

  const slot = figura.object3D.children[0];
  const info = meshesDe(slot);
  const cuerpoCargado = figura.cuerpo !== null;
  const peloCargado = figura.pelo !== null;

  console.log(`\n=== ${etiqueta} ===`);
  console.log(`  grupos bajo slot: ${slot.children.length}`);
  console.log(`  cuerpo GLB montado: ${cuerpoCargado}   pelo GLB montado: ${peloCargado}`);
  for (const t of info) {
    const ancho = t.caja.max.x - t.caja.min.x;
    const alto = t.caja.max.y - t.caja.min.y;
    console.log(
      `    ${t.visible ? "visible" : "OCULTO "} ${String(t.vert).padStart(6)} vert  ancho ${ancho.toFixed(3)}  alto ${alto.toFixed(3)}  y ${t.caja.min.y.toFixed(3)}..${t.caja.max.y.toFixed(3)}`,
    );
  }

  figura.dispose();
  return { cuerpos: cuerpoCargado, pelos: peloCargado, meshes: info.length };
}

/**
 * Reproduce el encuadre de las miniaturas de src/components/login/asset-thumb.tsx.
 * No hace falta WebGL para comprobar que la caja y la distancia salen finitas y
 * positiva: si el asset tuviera escala o bbox degenerados, aqui se veria.
 */
async function verificarEncuadre(manifiesto) {
  console.log("\nencuadre de miniaturas");
  for (const asset of manifiesto.assets) {
    const url = `${manifiesto.base}/${asset.archivo}`;
    let texto = "FALLA";
    try {
      const escena = await cargarEscena(url);
      const raiz = new THREE.Group();
      raiz.add(...escena.children.map((c) => c.clone(true)));
      const caja = new THREE.Box3().setFromObject(raiz);
      const tam = caja.getSize(new THREE.Vector3());
      if (!(tam.x > 0) || !(tam.y > 0)) throw new Error("bbox degenerada");
      const centro = caja.getCenter(new THREE.Vector3());
      const radio = Math.max(tam.x, tam.y, tam.z) / 2;
      const fov = 30;
      const distancia = (radio / Math.tan((fov * Math.PI) / 360)) * 1.2;
      if (!Number.isFinite(distancia) || distancia <= 0) throw new Error("distancia invalida");
      texto =
        `OK  tam ${tam.x.toFixed(2)}x${tam.y.toFixed(2)}x${tam.z.toFixed(2)}` +
        `  camara y ${(centro.y + radio * 0.12).toFixed(2)} z ${distancia.toFixed(2)}`;
    } catch (e) {
      texto = `FALLA -> ${motivo(e)}`;
      fallos += 1;
    }
    console.log(`  ${asset.id.padEnd(7)} ${texto}`);
  }
}

const CFG_BASE = {  gender: "male",
  skin: "#c68642",
  hair: "short",
  hairColor: "#2b1b12",
  outfit: "clasico",
  jersey: "#16a34a",
  shorts: "#f8fafc",
  socks: "#16a34a",
  shoes: "#111827",
  number: 7,
  pose: "idle",
  shield: "none",
  accessory: "none",
  background: "none",
  modelo: null,
  cabello: null,
};

let fallos = 0;
try {
  const manifiesto = await cargarManifiesto();

  console.log("carga directa de los .glb");
  for (const url of [
    "/models/avatares/web/av_mal.glb",
    "/models/avatares/web/cab1.glb",
    "/models/avatares/web/cab2.glb",
  ]) {
    console.log(`  ${url}  ${await probarCargaDirecta(url)}`);
  }

  await verificarEncuadre(manifiesto);

  const sinPelo = await probar(CFG_BASE, "cuerpo sin pelo");
  if (!sinPelo.cuerpos) {
    console.log("  PROBLEMA: el cuerpo GLB no se monto (se cae al procedural)");
    fallos += 1;
  }

  for (const id of ["cab1", "cab2"]) {
    const r = await probar({ ...CFG_BASE, cabello: id }, `cuerpo + ${id}`);
    if (!r.pelos) {
      console.log(`  PROBLEMA: ${id} no monto pelo GLB`);
      fallos += 1;
    }
  }
} finally {
  servidor.close();
}

console.log(fallos ? `\n${fallos} problema(s).` : "\nRuntime OK.");
process.exit(fallos ? 1 : 0);
