"use server";

import { revalidatePath } from "next/cache";
import { requireSection, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TEAM_ROLES = ["PLAYER", "CAPTAIN", "COACH", "OWNER"] as const;
type TeamRoleValue = (typeof TEAM_ROLES)[number];

export async function registerPlayerAndEnrollAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");

  const teamId = String(formData.get("teamId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawUsername = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawRole = String(formData.get("role") ?? "").trim().toUpperCase();
  const role: TeamRoleValue = (TEAM_ROLES as readonly string[]).includes(rawRole)
    ? (rawRole as TeamRoleValue)
    : "PLAYER";
  const lineupPosition = String(formData.get("lineupPosition") ?? "").trim() || null;

  if (!teamId) return { ok: false as const, error: "No se encontró tu equipo." };
  if (!name) return { ok: false as const, error: "Escribe el nombre." };
  if (!rawUsername) return { ok: false as const, error: "Escribe el nombre de usuario." };
  if (!email) return { ok: false as const, error: "Escribe el correo electrónico." };
  if (!email.includes("@")) return { ok: false as const, error: "El correo electrónico no es válido." };
  if (password.length < 6) {
    return { ok: false as const, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  // El entrenador solo puede inscribir en su propio equipo.
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: actor.id, role: { in: ["COACH", "OWNER", "CAPTAIN"] } },
    select: { id: true },
  });
  if (!membership) return { ok: false as const, error: "No tienes permisos sobre este equipo." };

  const username = rawUsername.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (!username) return { ok: false as const, error: "El nombre de usuario no es válido." };

  const existingEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingEmail) return { ok: false as const, error: "Ya existe un usuario con ese correo." };

  const existingUsername = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existingUsername) return { ok: false as const, error: "Ya existe ese nombre de usuario." };

  const hashed = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        username,
        password: hashed,
        role: "JUGADOR",
      },
      select: { id: true },
    });
    await tx.teamMember.create({
      data: { teamId, userId: user.id, role, lineupPosition },
    });
  });

  revalidatePath("/coach/equipo");
  return { ok: true as const };
}
