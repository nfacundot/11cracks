import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECTION_PREFIXES = ["/jugador", "/coach", "/admin", "/superadmin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url));
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
