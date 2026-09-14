"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  hashPassword,
  verifyToken,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  homeForRole,
} from "@/lib/auth";
import { touchStreak } from "@/lib/streak";

export type AuthState = { error?: string; success?: string; userId?: string; userName?: string; home?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(50),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72),
});

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username }] },
  });

  if (existing) {
    return { error: "El email o el usuario ya están registrados" };
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email: email.toLowerCase(),
      password: hashed,
    },
  });

  await touchStreak(user.id);

  return { success: "Cuenta creada", userId: user.id, userName: user.name };
}

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || !(await comparePassword(parsed.data.password, user.password))) {
    return { error: "Email o contraseña incorrectos" };
  }

  await setSessionCookie(signToken({ id: user.id }));
  await touchStreak(user.id);

  redirect(homeForRole(user.role));
}

export async function activateAccount(userId: string) {
  await setSessionCookie(signToken({ id: userId }));
  redirect(homeForRole("JUGADOR"));
}

export async function restoreSession(token: string): Promise<AuthState> {
  if (!token) return { error: "Sin sesión para restaurar" };

  const payload = verifyToken(token);
  if (!payload) return { error: "Sesión expirada" };

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, role: true },
  });
  if (!user) return { error: "Cuenta no encontrada" };

  await setSessionCookie(signToken({ id: user.id }));

  return { success: "Sesión restaurada", home: homeForRole(user.role) };
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}
