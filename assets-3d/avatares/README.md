# Avatares 3D (GLB)

## Estructura

```
assets-3d/avatares/            originales de Meshy (NO se sirven, no se versionan)
  avatares.config.json         metadatos manuales por asset
  _inbox/                      aqui se sueltan los .glb nuevos de Meshy
  masc/ fem/ cabello_m/ cabello_f/ prendas/

public/models/avatares/        lo unico que se sirve
  manifest.json                indice que consume la app (generado)
  web/                         .glb optimizados (Meshopt + WebP)
```

Los originales no pueden vivir en `public/`: 415 MB de export de Meshy se
copiarian al build y al deploy. Ademas los .glb originales estan en `.gitignore`
por tamano; se re-exportan desde Meshy si hacen falta.

## Como se compone la figura

El cuerpo viene de Meshy y **no** tiene pelo. El pelo es de dos formas:

* **Modelos GLB** (`web/cab1.glb`, `web/cab2.glb`): son recortes de la region de la
  cabeza de los personajes originales, publicados en el mismo "espacio de cabeza"
  que usa el procedural. Solo funcionan con cuerpos del mismo genero.
* **Peinado procedural** (`pelo.ts`): 10 estilos que si se pueden colorear de verdad.

```
src/lib/avatar3d/avatares/
  registro.ts   descarga y consulta el manifest
  figura.ts     FiguraAvatar: carga el cuerpo GLB, ancla el pelo, fallback procedural
  cabeza.ts     detectarCabeza(): localiza la cabeza sin esqueleto
  pelo.ts       10 peinados en "espacio de cabeza" (1 = radioX de la cabeza)
```

`detectarCabeza()` no puede usar huesos porque los export de Meshy vienen con
`skins=0, huesos=0`. Usa la proporcion de 7.5 cabezas para situar la banda de la
cabeza y luego afina el centro con la mediana de los vertices de esa banda (descarta
pelo y brazos por distancia) y los radios con el ancho/profundidad medidos.

Si cambias un cuerpo, corre `npm run avatares:cabeza` para comprobar que el ancla
sigue cayendo sobre la cabeza, y `npm run avatares:pelo` para comprobar que cada
modelo de pelo cae dentro de la nueva banda.

## Recortar el pelo de un personaje completo

`cab1.glb` y `cab2.glb` originales son personajes en T-pose, no piezas de pelo
(6.1M y 6.9M triangulos, 187 MB y 199 MB). Como el pelo viene horneado en una
textura compartida con el cuerpo, no se puede separar por textura; lo que si se
puede es recortar la geometria de la cabeza:

```bash
node --max-old-space-size=8192 scripts/recortar-pelo.mjs \
  --cuerpo assets-3d/avatares/masc/av_mal.glb \
  --caja 1.15:1.45 \
  assets-3d/avatares/cabello_m/cab1.glb assets-3d/avatares/cabello_m/cab2.glb

npx @gltf-transform/cli@4.5.1 optimize "public/models/avatares/web/_pelo/cab1.glb" \
  "public/models/avatares/web/cab1.glb" --compress meshopt --simplify true \
  --simplify-ratio 0.33 --simplify-error 0.001 --texture-compress webp --texture-size 1024
```

* `--cuerpo` da el ancla y el `radioX` de referencia. **Usalo siempre**: los
  personajes en T-pose autodetectan mal la cabeza.
* `--caja X:Z` son los semiejes del recorte en espacio de cabeza. `1.15:1.45` saca
  la cabeza sin arrastrar hombros.
* La salida sale en `public/models/avatares/web/_pelo/`: es intermedia, borrala.
* El recorte queda con textura JPEG de 2048 y ~8 MB; `optimize` lo deja en ~300 KB.

Despues: `npm run avatares:build`, `npm run avatares:inspect` y
`npm run avatares:pelo`.

Limitacion: el recorte se lleva por delante la cara, porque la cabeza es una sola
malla con el pelo horneado. Ademas el color va horneado, asi que `hairColor` no
tiñe estos modelos y la UI lo deshabilita cuando hay uno seleccionado.

## Agregar un avatar

1. Exporta el .glb de Meshy y dejalo en `assets-3d/avatares/_inbox/`.
2. Muevelo a la carpeta segun su tipo (`masc/`, `fem/`, `cabello_m/`, ...).
3. Si es un cuerpo, optimiza (el comando es el que produce los 370-400 KB actuales):

   ```bash
   npx @gltf-transform/cli@4.5.1 optimize "assets-3d/avatares/masc/nuevo.glb" "public/models/avatares/web/nuevo.glb" --compress meshopt --texture-compress webp --texture-size 1024 --simplify-ratio 0.23 --simplify-error 0.002
   ```

   * Cuerpos: `--simplify-ratio 0.23` (~40k triangulos).
   * Pelo: recorta primero con `scripts/recortar-pelo.mjs` (ver arriba).
   * `--texture-size 1024` es clave: las texturas de Meshy vienen a 2048 y son la
     mayor parte del peso.
4. Registra nombre y slots en `assets-3d/avatares/avatares.config.json`. Para pelo
   que ya viene recortado, `ocupa: ["cabello"]` (no `["cuerpo","cabello"]`).
5. Regenera y revisa:

   ```bash
   npm run avatares:build
   npm run avatares:inspect -- public/models/avatares/web
   npm run avatares:cabeza
   npm run avatares:pelo
   ```

## Limites conocidos

- Los cuerpos de Meshy vienen **sin rig**: no hay animaciones ni caminar. Mientras
  no haya esqueleto, `FiguraAvatar` delega las poses en el avatar procedural.
- La piel va horneada en la textura base, asi que el selector de tono solo aproxima
  el tinte multiplicando `material.color`. Para un tinte real hace falta una
  mascara (Meshy "Texture with masks" o Blender).
- Igual que la piel, el pelo GLB trae el color horneado: `hairColor` no lo tiñe.
- El recorte de pelo arrastra la cara de los personajes originales.
- `optimize` de gltf-transform hornea una escala/traslacion en el nodo. Es correcto
  en runtime (three.js la aplica), pero los scripts que leen accessors en crudo sin
  mirar `nodes` reportan cajas equivocadas: por eso los verificadores re-codifican
  a float plano antes de medir.
- Presupuesto por archivo: <= 400 KB y <= 40k triangulos.
