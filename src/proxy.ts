import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "11cracks_session";
const SECTION_PREFIXES = ["/jugador", "/coach", "/admin", "/superadmin"];

function b64urlDecodeToBytes(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.padEnd(Math.ceil(s.length / 4) * 4, "=");
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [headerB64, payloadB64, sigB64] = parts;
  let payload: { exp?: number } = {};
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payloadB64)));
  } catch {
    return false;
  }

  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    return false;
  }

  try {
    const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecodeToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    return ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /register no existe como ruta propia (el registro es una pestaña en /login).
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Normaliza URLs antiguas <sección>/dashboard a la ruta real de la sección.
  if (pathname === "/coach/dashboard") {
    return NextResponse.redirect(new URL("/coach", request.url));
  }
  if (pathname === "/jugador/dashboard") {
    return NextResponse.redirect(new URL("/jugador", request.url));
  }

  // Un usuario logueado no debe poder entrar a /login (ni volver con el botón atrás).
  if (pathname === "/login") {
    if (await hasValidSession(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (request.cookies.get(SESSION_COOKIE)?.value) {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
  }

  // Secciones protegidas: exigen una sesión válida, no solo la galleta presente.
  if (SECTION_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!(await hasValidSession(request))) {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/jugador/:path*",
    "/coach/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
  ],
};