import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECTION_PREFIXES = ["/jugador", "/coach", "/admin", "/superadmin"];

export function proxy(request: NextRequest) {
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

  if (SECTION_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const hasSession = Boolean(request.cookies.get("11cracks_session")?.value);
    if (!hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
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