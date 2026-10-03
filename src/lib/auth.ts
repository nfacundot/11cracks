import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "11cracks_session";
export const TOKEN_COOKIE = "11cracks_token";
export const LOGOUT_COOKIE = "11cracks_logged_out";

export const PROTECTED_EMAILS = ["superadmin@gmail.com", "admin@gmail.com"];

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export function signToken(payload: { id: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { id: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  // Réplica legible para que el cliente pueda guardarla como respaldo
  // cuando el WebView nativo pierde las cookies (cierre de la app).
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(TOKEN_COOKIE);
  // Marca para que el cliente borre su respaldo local tras un logout.
  cookieStore.set(LOGOUT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      avatarUrl: true,
      avatarConfig: true,
      role: true,
      bio: true,
      position: true,
      favoriteTeam: true,
      country: true,
      xp: true,
      coins: true,
      trophies: true,
      energy: true,
      needs: true,
      currentStreak: true,
      bestStreak: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  return user;
}

const ROLE_RANK: Record<string, number> = {
  JUGADOR: 0,
  ENTRENADOR: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
};

export function homeForRole(role: string): string {
  switch (role) {
    case "SUPERADMIN":
      return "/superadmin";
    case "ADMIN":
      return "/admin";
    case "ENTRENADOR":
      return "/coach";
    default:
      return "/jugador";
  }
}

export function hasRole(userRole: string, minRole: string): boolean {
  return (ROLE_RANK[userRole] ?? -1) >= (ROLE_RANK[minRole] ?? Infinity);
}

export async function requireSection(
  minRole: "JUGADOR" | "ENTRENADOR" | "ADMIN" | "SUPERADMIN"
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  if (!hasRole(user.role, minRole)) {
    redirect(homeForRole(user.role));
  }
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  if (!hasRole(user.role, "ADMIN")) {
    redirect(homeForRole(user.role));
  }
  return user;
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
