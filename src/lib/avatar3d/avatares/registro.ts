export type SlotAvatar = "cuerpo" | "cabello" | "prenda" | "accesorio";
export type GeneroAvatar = "todos" | "masculino" | "femenino";

export type AssetAvatar = {
  id: string;
  tipo: SlotAvatar | "animacion";
  genero: GeneroAvatar;
  nombre: string;
  /** Slots que este asset reemplaza. Los cuerpos no llevan pelo: el slot "cabello" va aparte. */
  ocupa: SlotAvatar[];
  /** Ruta relativa al base del manifiesto. */
  archivo: string;
  kb: number;
  triangulos: number;
  animable: boolean;
};

export type ManifiestoAvatar = {
  version: number;
  base: string;
  actualizado?: string;
  assets: AssetAvatar[];
};

const VACIO: ManifiestoAvatar = { version: 1, base: "/models/avatares", assets: [] };

let pendiente: Promise<ManifiestoAvatar> | null = null;

/**
 * Descarga (una sola vez por pagina) el indice de assets generado por
 * scripts/generar-manifest-avatares.mjs.
 *
 * `no-cache` y no `force-cache`: el manifiesto se regenera con un script mientras
 * el dev server esta corriendo, y con force-cache el navegador se queda con el
 * indice viejo y los assets nuevos no aparecen. No-cache revalida, que con el
 * ETag que manda Next sale un 304 barato.
 */
export function cargarManifiesto(): Promise<ManifiestoAvatar> {
  pendiente ??= fetch("/models/avatares/manifest.json", { cache: "no-cache" })
    .then((res) => (res.ok ? (res.json() as Promise<ManifiestoAvatar>) : VACIO))
    .then((data) => (Array.isArray(data?.assets) ? data : VACIO))
    .catch(() => VACIO);
  return pendiente;
}

/** Solo para tests/scripts: descarta la cache del manifiesto. */
export function olvidarManifiesto() {
  pendiente = null;
}

export function buscarAsset(manifiesto: ManifiestoAvatar, id: string | null | undefined) {
  if (!id) return null;
  return manifiesto.assets.find((a) => a.id === id) ?? null;
}

export function listarPorSlot(
  manifiesto: ManifiestoAvatar,
  slot: SlotAvatar,
  genero: GeneroAvatar,
): AssetAvatar[] {
  return manifiesto.assets.filter(
    (a) => a.ocupa.includes(slot) && (a.genero === "todos" || a.genero === genero),
  );
}

export function urlDeAsset(manifiesto: ManifiestoAvatar, asset: AssetAvatar) {
  return `${manifiesto.base}/${asset.archivo}`;
}