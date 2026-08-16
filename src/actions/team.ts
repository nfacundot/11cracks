"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export type TeamState = { error?: string; success?: string } | undefined;

function generateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createTeam(prev: TeamState, formData: FormData): Promise<TeamState> {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim().slice(0, 200);

  if (name.length < 2 || name.length > 40) {
    return { error: "El nombre debe tener entre 2 y 40 caracteres" };
  }

  let code = generateCode();
  while (await prisma.team.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const team = await prisma.team.create({
    data: { name, description: description || null, code },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: user.role === "COACH" ? "COACH" : "OWNER",
    },
  });

  await notify(
    user.id,
    "TEAM",
    user.role === "COACH" ? "¡Equipo creado! 🛡️" : "¡Equipo creado! 🛡️",
    `"${team.name}" está listo. Comparte el código ${team.code} para invitar jugadores.`,
    { icon: "🛡️", link: `/team/${team.id}` }
  );

  redirect(`/team/${team.id}`);
}

export async function joinTeam(prev: TeamState, formData: FormData): Promise<TeamState> {
  const user = await requireUser();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (code.length < 4) {
    return { error: "Código no válido" };
  }

  const team = await prisma.team.findUnique({ where: { code } });
  if (!team) {
    return { error: "No encontramos un equipo con ese código" };
  }

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
  });

  if (already) {
    return { error: "Ya perteneces a este equipo" };
  }

  await prisma.teamMember.create({
    data: { teamId: team.id, userId: user.id, role: "PLAYER" },
  });

  await notify(
    user.id,
    "TEAM",
    "¡Te uniste al equipo! ⚽",
    `Ahora formas parte de "${team.name}".`,
    { icon: "⚽", link: `/team/${team.id}` }
  );

  redirect(`/team/${team.id}`);
}

export async function addMember(
  prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") || "");
  const username = String(formData.get("username") || "").trim().replace(/^@/, "");

  if (!username) {
    return { error: "Escribe el usuario del estudiante" };
  }

  const myMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });

  if (!myMembership || myMembership.role === "PLAYER") {
    return { error: "No tienes permisos" };
  }

  const student = await prisma.user.findUnique({ where: { username } });
  if (!student) {
    return { error: `No existe un usuario llamado @${username}` };
  }

  if (student.id === user.id) {
    return { error: "No puedes agregarte a ti mismo" };
  }

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: student.id } },
  });
  if (already) {
    return { error: `${student.name} ya pertenece al equipo` };
  }

  await prisma.teamMember.create({
    data: { teamId, userId: student.id, role: "PLAYER" },
  });

  await notify(
    student.id,
    "TEAM",
    "¡Te agregaron a un equipo! ⚽",
    `Tu entrenador te agregó al equipo.`,
    { icon: "⚽", link: `/team/${teamId}` }
  );

  return { success: `${student.name} se unió al equipo` };
}

export async function leaveTeam(teamId: string) {
  const user = await requireUser();

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!member) return;

  if (member.role === "OWNER") {
    const otherMembers = await prisma.teamMember.count({
      where: { teamId, userId: { not: user.id } },
    });
    if (otherMembers === 0) {
      await prisma.team.delete({ where: { id: teamId } });
    } else {
      const nextOwner = await prisma.teamMember.findFirst({
        where: { teamId, userId: { not: user.id } },
        orderBy: { joinedAt: "asc" },
      });
      if (nextOwner) {
        await prisma.teamMember.update({
          where: { id: nextOwner.id },
          data: { role: "OWNER" },
        });
        await notify(
          nextOwner.userId,
          "TEAM",
          "Ahora eres el capitán",
          `Has sido nombrado dueño de "${member.teamId}".`,
          { icon: "🛡️", link: `/team/${teamId}` }
        );
      }
    }
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId: user.id },
  });

  await notify(user.id, "TEAM", "Saliste del equipo", "Ya no perteneces a este equipo.", {
    icon: "👋",
    link: "/teams",
  });

  redirect("/teams");
}

export async function removeMember(teamId: string, memberUserId: string) {
  const user = await requireUser();

  const myMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });

  if (!myMembership || myMembership.role === "PLAYER") {
    return { error: "No tienes permisos" };
  }

  if (memberUserId === user.id) {
    return { error: "No puedes eliminarte a ti mismo" };
  }

  await prisma.teamMember.deleteMany({ where: { teamId, userId: memberUserId } });
  await notify(memberUserId, "TEAM", "Fuiste eliminado del equipo", "Un capitán te sacó del equipo.", {
    icon: "🚪",
    link: "/teams",
  });

  redirect(`/team/${teamId}`);
}
