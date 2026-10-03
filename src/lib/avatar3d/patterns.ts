import * as THREE from "three";

const patternCache = new Map<string, THREE.Texture>();
const numberCache = new Map<string, THREE.Texture>();

const SIZE = 128;

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  return canvas;
}

function finishTexture(canvas: HTMLCanvasElement, repeat = 2): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

export function garmentPattern(id: string): THREE.Texture | null {
  if (id === "none" || !id) return null;

  const cached = patternCache.get(id);
  if (cached) return cached;

  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = "#c2c2c2";

  if (id === "vstripes") {
    for (let x = 0; x < SIZE; x += 26) ctx.fillRect(x, 0, 11, SIZE);
  } else if (id === "hstripes") {
    for (let y = 0; y < SIZE; y += 26) ctx.fillRect(0, y, SIZE, 11);
  } else if (id === "checkers") {
    const cell = 32;
    for (let y = 0; y < SIZE; y += cell) {
      for (let x = 0; x < SIZE; x += cell) {
        if ((x / cell + y / cell) % 2 === 0) ctx.fillRect(x, y, cell, cell);
      }
    }
  } else if (id === "diagonal") {
    ctx.save();
    ctx.translate(SIZE / 2, SIZE / 2);
    ctx.rotate(-Math.PI / 4);
    for (let i = -SIZE * 2; i < SIZE * 2; i += 30) ctx.fillRect(i, -SIZE * 2, 13, SIZE * 4);
    ctx.restore();
  } else {
    return null;
  }

  const texture = finishTexture(canvas, id === "checkers" ? 1 : 2);
  patternCache.set(id, texture);
  return texture;
}

export function contrastColor(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#111827" : "#ffffff";
}

export function numberTexture(value: number, color: string): THREE.Texture {
  const key = `${value}-${color}`;
  const cached = numberCache.get(key);
  if (cached) return cached;

  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const empty = new THREE.CanvasTexture(canvas);
    return empty;
  }

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = color;
  ctx.font = "bold 98px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), SIZE / 2, SIZE / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  numberCache.set(key, texture);
  return texture;
}
