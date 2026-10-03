"use server";

import { randomBytes } from "crypto";
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
import { validateAvatarConfig } from "@/lib/avatar";

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

function generateTeamCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

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

  const rawRole = String(formData.get("role") || "");
  if (rawRole !== "player" && rawRole !== "coach") {
    return { error: "Selecciona si eres jugador o entrenador" };
  }
  const role = rawRole === "coach" ? "ENTRENADOR" : "JUGADOR";

  if (String(formData.get("consent") || "") !== "true") {
    return { error: "Debes aceptar el consentimiento para continuar" };
  }

  let teamId: string | null = null;
  let teamName = "";
  let teamLogo: string | null = null;

  if (role === "JUGADOR") {
    const code = String(formData.get("teamCode") || "").trim().toUpperCase();
    if (code.length < 4) {
      return { error: "Escribe un código de equipo válido" };
    }
    const team = await prisma.team.findUnique({ where: { code } });
    if (!team) {
      return { error: "No encontramos un equipo con ese código" };
    }
    teamId = team.id;
    teamName = team.name;
  } else {
    teamName = String(formData.get("teamName") || "").trim();
    if (teamName.length < 2 || teamName.length > 40) {
      return { error: "El nombre del equipo debe tener entre 2 y 40 caracteres" };
    }
    const logo = String(formData.get("logoUrl") || "").trim();
    if (logo && !logo.startsWith("/uploads/")) {
      return { error: "Logo de equipo inválido" };
    }
    teamLogo = logo || null;
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username }] },
  });

  if (existing) {
    return { error: "El email o el usuario ya están registrados" };
  }

  const rawAvatar = formData.get("avatarConfig");
  let avatarConfig: ReturnType<typeof validateAvatarConfig> = null;
  if (typeof rawAvatar === "string" && rawAvatar.length > 0) {
    try {
      avatarConfig = validateAvatarConfig(JSON.parse(rawAvatar));
    } catch {
      avatarConfig = null;
    }
  }

  const hashed = await hashPassword(password);

  let newTeamCode = "";
  if (role === "ENTRENADOR") {
    newTeamCode = generateTeamCode();
    while (await prisma.team.findUnique({ where: { code: newTeamCode } })) {
      newTeamCode = generateTeamCode();
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        username,
        email: email.toLowerCase(),
        password: hashed,
        role,
        avatarConfig: avatarConfig ?? undefined,
        consentedAt: new Date(),
      },
    });

    if (role === "ENTRENADOR") {
      const team = await tx.team.create({
        data: { name: teamName, code: newTeamCode, logoUrl: teamLogo },
      });
      await tx.teamMember.create({
        data: { teamId: team.id, userId: created.id, role: "COACH" },
      });
    } else if (teamId) {
      await tx.teamMember.create({
        data: { teamId, userId: created.id, role: "PLAYER" },
      });
    }

    return created;
  });

  await touchStreak(user.id);
  await setSessionCookie(signToken({ id: user.id }));

  redirect(homeForRole(role));
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
