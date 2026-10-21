/**
 * Lee public/models/avatares/manifest.json desde disco.
 *
 * El runtime lo baja por fetch (registro.ts), pero los scripts de verificacion
 * corren en Node y necesitan el mismo dato sin levantar la app.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function leerManifiestoLocal(raiz = process.cwd()) {
  const ruta = join(raiz, "public", "models", "avatares", "manifest.json");
  const data = JSON.parse(readFileSync(ruta, "utf8"));
  if (!Array.isArray(data?.assets)) throw new Error(`${ruta} no tiene "assets"`);
  return data;
}
