"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireStaff } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { publishTactics } from "@/lib/tactics-bus";

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
      role: user.role === "ENTRENADOR" ? "COACH" : "OWNER",
    },
  });

  await notify(
    user.id,
    "TEAM",
    user.role === "ENTRENADOR" ? "¡Equipo creado! 🛡️" : "¡Equipo creado! 🛡️",
    `"${team.name}" está listo. Comparte el código ${team.code} para invitar jugadores.`,
    { icon: "🛡️", link: `/jugador/team/${team.id}` }
  );

  redirect(`/jugador/team/${team.id}`);
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
    { icon: "⚽", link: `/jugador/team/${team.id}` }
  );

  redirect(`/jugador/team/${team.id}`);
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
    { icon: "⚽", link: `/jugador/team/${teamId}` }
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
          { icon: "🛡️", link: `/jugador/team/${teamId}` }
        );
      }
    }
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId: user.id },
  });

  await notify(user.id, "TEAM", "Saliste del equipo", "Ya no perteneces a este equipo.", {
    icon: "👋",
    link: "/jugador/teams",
  });

  redirect("/jugador/teams");
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
    link: "/jugador/teams",
  });

  redirect(`/jugador/team/${teamId}`);
}

const LINEUP_POSITIONS = [
  "POR",
  "LD",
  "DFC",
  "LI",
  "MCD",
  "MC",
  "MCO",
  "ED",
  "EI",
  "DC",
  "SD",
] as const;

export async function saveTeamConfiguration(
  prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const user = await requireUser();

  if (user.role !== "ENTRENADOR" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return { error: "Solo los entrenadores pueden configurar equipos" };
  }

  const rawTeamId = String(formData.get("teamId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim();

  // Entradas con formato "<userId>|<POSICION>" (posición opcional)
  const entries = formData
    .getAll("members")
    .map((v) => String(v).split("|"))
    .map(([id, pos]) => ({ id, pos: pos || null }));
  const memberIds = entries.map((e) => e.id).filter((id) => id && id !== user.id);

  if (name.length < 2 || name.length > 40) {
    return { error: "El nombre debe tener entre 2 y 40 caracteres" };
  }

  if (logoUrl && !logoUrl.startsWith("/uploads/")) {
    return { error: "Logo inválido" };
  }

  if (memberIds.length > LINEUP_POSITIONS.length) {
    return { error: `Máximo ${LINEUP_POSITIONS.length} jugadores en cancha` };
  }

  if (new Set(memberIds).size !== memberIds.length) {
    return { error: "Hay jugadores duplicados en la selección" };
  }

  // Validar que los miembros existan y sean jugadores
  const members = await prisma.user.findMany({
    where: { id: { in: memberIds }, role: "JUGADOR" },
    select: { id: true },
  });
  if (members.length !== memberIds.length) {
    return { error: "Hay jugadores inválidos en la selección" };
  }

  // Validar posiciones de alineación
  for (const entry of entries) {
    if (entry.pos && !(LINEUP_POSITIONS as readonly string[]).includes(entry.pos)) {
      return { error: `Posición inválida: ${entry.pos}` };
    }
  }
  const seenPositions = new Set(
    entries.map((e) => e.pos).filter((pos): pos is string => Boolean(pos)),
  );
  if (seenPositions.size !== [...entries.map((e) => e.pos)].filter(Boolean).length) {
    return { error: "No puedes repetir una posición en la alineación" };
  }

  // Equipo propio del coach (o creación)
  let team;
  if (rawTeamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: rawTeamId, userId: user.id } },
    });
    if (!membership || membership.role === "PLAYER") {
      return { error: "No tienes permisos sobre ese equipo" };
    }
    team = await prisma.team.findUnique({ where: { id: rawTeamId } });
    if (!team) return { error: "Equipo no encontrado" };
  } else {
    let code = generateCode();
    while (await prisma.team.findUnique({ where: { code } })) {
      code = generateCode();
    }
    team = await prisma.team.create({ data: { name, code } });
  }

  const posById = new Map(entries.map((e) => [e.id, e.pos]));

  await prisma.$transaction([
    prisma.team.update({
      where: { id: team.id },
      data: { name, ...(logoUrl ? { logoUrl } : {}) },
    }),
    // El coach siempre queda registrado como miembro COACH
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: user.id } },
      create: { teamId: team.id, userId: user.id, role: "COACH" },
      update: { role: "COACH", lineupPosition: null },
    }),
    // Altas/actualizaciones de jugadores seleccionados con su posición
    ...memberIds.map((id) =>
      prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: id } },
        create: {
          teamId: team.id,
          userId: id,
          role: "PLAYER",
          lineupPosition: posById.get(id) ?? null,
        },
        update: { role: "PLAYER", lineupPosition: posById.get(id) ?? null },
      }),
    ),
    // Bajas de jugadores desmarcados (nunca toca al coach/capitán/owner)
    prisma.teamMember.deleteMany({
      where: {
        teamId: team.id,
        role: "PLAYER",
        userId: { notIn: memberIds },
      },
    }),
  ]);

  revalidatePath("/coach/configuracion");
  return { success: "Configuración del equipo guardada" };
}

export async function updateMemberPosition(
  teamId: string,
  playerId: string,
  pos: string,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();

  if (user.role !== "ENTRENADOR" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return { error: "Solo los entrenadores pueden configurar equipos" };
  }

  if (!teamId) {
    return { error: "El equipo aún no existe" };
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!membership || membership.role === "PLAYER") {
    return { error: "No tienes permisos sobre ese equipo" };
  }

  const player = await prisma.user.findUnique({ where: { id: playerId } });
  if (!player || player.role !== "JUGADOR") {
    return { error: "Jugador inválido" };
  }

  const lineupPosition = pos || null;
  if (lineupPosition && !(LINEUP_POSITIONS as readonly string[]).includes(lineupPosition)) {
    return { error: `Posición inválida: ${lineupPosition}` };
  }

  // Una misma posición no puede repetirse dentro del equipo
  if (lineupPosition) {
    const taken = await prisma.teamMember.findFirst({
      where: {
        teamId,
        role: "PLAYER",
        lineupPosition,
        userId: { not: playerId },
      },
    });
    if (taken) {
      return { error: "Esa posición ya está ocupada por otro jugador" };
    }
  }

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: playerId } },
    create: { teamId, userId: playerId, role: "PLAYER", lineupPosition },
    update: { lineupPosition },
  });

  revalidatePath("/coach/configuracion");
  return { success: "Posición actualizada" };
}

export type TrazoData = { color: string; width: number; alpha: number; puntos: { x: number; y: number }[] };

async function requireCoachPerm(teamId: string) {
  const user = await requireUser();
  if (user.role !== "ENTRENADOR" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return { user: null, error: "Solo los entrenadores pueden editar la táctica" as const };
  }
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!membership || membership.role === "PLAYER") {
    return { user: null, error: "No tienes permisos sobre ese equipo" as const };
  }
  return { user, error: null as null };
}

function cleanPositions(raw: Record<string, { x: number; y: number }> | undefined) {
  const clean: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(raw ?? {}).slice(0, 15)) {
    const x = Number(p?.x);
    const y = Number(p?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    clean[id] = {
      x: Math.min(100, Math.max(0, Math.round(x * 10) / 10)),
      y: Math.min(100, Math.max(0, Math.round(y * 10) / 10)),
    };
  }
  return clean;
}

function cleanTrazos(trazos: TrazoData[] | undefined) {
  return Array.isArray(trazos)
    ? trazos.slice(0, 50).map((t) => ({
        color: String(t.color || "#F3F0E8").slice(0, 10),
        width: Math.min(20, Math.max(1, Number(t.width) || 2.5)),
        alpha: Math.min(1, Math.max(0.05, Number(t.alpha) || 1)),
        puntos: (t.puntos ?? []).slice(0, 500).map((pt) => ({
          x: Math.round(Number(pt.x) * 1000) / 1000,
          y: Math.round(Number(pt.y) * 1000) / 1000,
        })),
      }))
    : [];
}

export async function getAlignments(
  teamId: string,
): Promise<{ id: string; name: string; formation: string; published: boolean; order: number }[]> {
  return prisma.alignment.findMany({
    where: { teamId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, formation: true, published: true, order: true },
  });
}

export async function getAlignmentData(
  alignmentId: string,
): Promise<{
  error?: string;
  data?: { formation: string; positions: Record<string, { x: number; y: number }>; trazos: TrazoData[]; published: boolean; name: string };
}> {
  const alignment = await prisma.alignment.findUnique({
    where: { id: alignmentId },
    select: { id: true, formation: true, positions: true, trazos: true, published: true, name: true },
  });
  if (!alignment) return { error: "Alineación no encontrada" };

  return {
    data: {
      formation: alignment.formation,
      positions: (alignment.positions as Record<string, { x: number; y: number }>) ?? {},
      trazos: (alignment.trazos as TrazoData[]) ?? [],
      published: alignment.published,
      name: alignment.name,
    },
  };
}

export async function createAlignment(
  teamId: string,
  name: string,
): Promise<{ error?: string; alignment?: { id: string; name: string; formation: string } }> {
  const { error } = await requireCoachPerm(teamId);
  if (error) return { error };

  const safeName = String(name || "").trim().slice(0, 60) || "Alineación";
  const maxOrder = await prisma.alignment.findFirst({
    where: { teamId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const alignment = await prisma.alignment.create({
    data: {
      teamId,
      name: safeName,
      formation: "4-3-3",
      order: (maxOrder?.order ?? -1) + 1,
    },
  });
  return { alignment: { id: alignment.id, name: alignment.name, formation: alignment.formation } };
}

export async function saveAlignment(
  alignmentId: string,
  formation: string,
  positions: Record<string, { x: number; y: number }>,
  trazos?: TrazoData[],
): Promise<{ error?: string; success?: string }> {
  const alignment = await prisma.alignment.findUnique({ where: { id: alignmentId }, select: { id: true, teamId: true } });
  if (!alignment) return { error: "Alineación no encontrada" };

  const { error } = await requireCoachPerm(alignment.teamId);
  if (error) return { error };

  const f = String(formation || "").trim().slice(0, 12) || "4-3-3";
  const clean = cleanPositions(positions);
  const t = cleanTrazos(trazos);

  const updated = await prisma.alignment.update({
    where: { id: alignmentId },
    data: { formation: f, positions: clean as any, trazos: t as any },
  });

  publishTactics(alignment.teamId, {
    alignmentId: updated.id,
    formation: updated.formation,
    positions: updated.positions,
    trazos: updated.trazos,
    published: updated.published,
    name: updated.name,
  });
  return { success: "Alineación guardada" };
}

export async function publishAlignment(
  alignmentId: string,
  name?: string,
): Promise<{ error?: string; success?: string }> {
  const alignment = await prisma.alignment.findUnique({ where: { id: alignmentId }, select: { id: true, teamId: true } });
  if (!alignment) return { error: "Alineación no encontrada" };

  const { error } = await requireCoachPerm(alignment.teamId);
  if (error) return { error };

  const safeName = name !== undefined ? String(name || "").trim().slice(0, 60) || "Alineación" : undefined;

  const updated = await prisma.alignment.update({
    where: { id: alignmentId },
    data: { published: true, ...(safeName ? { name: safeName } : {}) },
  });

  publishTactics(alignment.teamId, {
    alignmentId: updated.id,
    formation: updated.formation,
    positions: updated.positions,
    trazos: updated.trazos,
    published: true,
    name: updated.name,
  });
  return { success: "Publicado para el equipo" };
}

export async function unpublishAlignment(
  alignmentId: string,
): Promise<{ error?: string; success?: string }> {
  const alignment = await prisma.alignment.findUnique({ where: { id: alignmentId }, select: { id: true, teamId: true } });
  if (!alignment) return { error: "Alineación no encontrada" };

  const { error } = await requireCoachPerm(alignment.teamId);
  if (error) return { error };

  const updated = await prisma.alignment.update({
    where: { id: alignmentId },
    data: { published: false },
  });

  publishTactics(alignment.teamId, {
    alignmentId: updated.id,
    formation: updated.formation,
    positions: updated.positions,
    trazos: updated.trazos,
    published: false,
    name: updated.name,
  });
  return { success: "Vuelto a borrador" };
}

export async function renameAlignment(
  alignmentId: string,
  name: string,
): Promise<{ error?: string; success?: string }> {
  const alignment = await prisma.alignment.findUnique({ where: { id: alignmentId }, select: { id: true, teamId: true } });
  if (!alignment) return { error: "Alineación no encontrada" };

  const { error } = await requireCoachPerm(alignment.teamId);
  if (error) return { error };

  const safeName = String(name || "").trim().slice(0, 60) || "Alineación";

  const updated = await prisma.alignment.update({
    where: { id: alignmentId },
    data: { name: safeName },
  });

  publishTactics(alignment.teamId, {
    alignmentId: updated.id,
    formation: updated.formation,
    positions: updated.positions,
    trazos: updated.trazos,
    published: updated.published,
    name: updated.name,
  });
  return { success: "Nombre actualizado" };
}

export async function deleteAlignment(
  alignmentId: string,
): Promise<{ error?: string; success?: string }> {
  const alignment = await prisma.alignment.findUnique({ where: { id: alignmentId }, select: { id: true, teamId: true } });
  if (!alignment) return { error: "Alineación no encontrada" };

  const { error } = await requireCoachPerm(alignment.teamId);
  if (error) return { error };

  await prisma.alignment.delete({ where: { id: alignmentId } });
  return { success: "Alineación eliminada" };
}

export type ClubCodeResult = {
  valid: boolean;
  team?: { id: string; name: string; logoUrl: string | null; code: string; memberCount: number };
  error?: string;
};

export async function validateClubCode(code: string): Promise<ClubCodeResult> {
  const cleaned = code.trim().toUpperCase();
  if (cleaned.length < 4) {
    return { valid: false, error: "El código debe tener al menos 4 caracteres" };
  }

  const team = await prisma.team.findUnique({
    where: { code: cleaned },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      code: true,
      _count: { select: { members: true } },
    },
  });

  if (!team) {
    return { valid: false, error: "No encontramos un equipo con ese código" };
  }

  return {
    valid: true,
    team: { id: team.id, name: team.name, logoUrl: team.logoUrl, code: team.code, memberCount: team._count.members },
  };
}

export async function createTeamForUser(userId: string, name: string, logoUrl?: string): Promise<TeamState> {
  const me = await requireStaff();

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return { error: "El nombre del equipo debe tener al menos 2 caracteres" };
  if (trimmed.length > 40) return { error: "El nombre es demasiado largo" };

  let code = generateCode();
  while (await prisma.team.findUnique({ where: { code } })) {
    code = generateCode();
  }

  if (logoUrl && !logoUrl.startsWith("/uploads/")) {
    return { error: "Logo inválido" };
  }

  const team = await prisma.team.create({
    data: {
      name: trimmed,
      code,
      logoUrl: logoUrl || null,
    },
  });

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "COACH" },
  });

  revalidatePath("/admin/users");
  return { success: `Equipo "${trimmed}" creado. Código: ${code}` };
}

export async function joinTeamForUser(userId: string, teamCode: string): Promise<TeamState> {
  const me = await requireStaff();

  const code = teamCode.trim().toUpperCase();
  if (code.length < 4) return { error: "Código no válido" };

  const team = await prisma.team.findUnique({ where: { code } });
  if (!team) return { error: "No encontramos un equipo con ese código" };

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId } },
  });
  if (already) return { error: "Este usuario ya pertenece a ese equipo" };

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "PLAYER" },
  });

  revalidatePath("/admin/users");
  return { success: `Usuario asignado al equipo "${team.name}"` };
}

// Self-service actions for registration wizard (no auth required, userId passed directly)

export async function selfSetRole(userId: string, role: "coach" | "player"): Promise<TeamState> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  await prisma.user.update({
    where: { id: userId },
    data: { role: role === "coach" ? "ENTRENADOR" : "JUGADOR" },
  });

  revalidatePath("/admin/users");
  return { success: role === "coach" ? "Rol de entrenador asignado" : "Rol de jugador asignado" };
}

export async function selfCreateTeam(userId: string, name: string, logoUrl?: string): Promise<TeamState> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return { error: "El nombre del equipo debe tener al menos 2 caracteres" };
  if (trimmed.length > 40) return { error: "El nombre es demasiado largo" };

  let code = generateCode();
  while (await prisma.team.findUnique({ where: { code } })) {
    code = generateCode();
  }

  if (logoUrl && !logoUrl.startsWith("/uploads/")) {
    return { error: "Logo inválido" };
  }

  const team = await prisma.team.create({
    data: {
      name: trimmed,
      code,
      logoUrl: logoUrl || null,
    },
  });

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "COACH" },
  });

  revalidatePath("/admin/users");
  return { success: `Equipo "${trimmed}" creado. Código: ${code}` };
}

export async function selfJoinTeam(userId: string, teamCode: string): Promise<TeamState> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  const code = teamCode.trim().toUpperCase();
  if (code.length < 4) return { error: "Código no válido" };

  const team = await prisma.team.findUnique({ where: { code } });
  if (!team) return { error: "No encontramos un equipo con ese código" };

  const already = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: team.id, userId } },
  });
  if (already) return { error: "Este usuario ya pertenece a ese equipo" };

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "PLAYER" },
  });

  revalidatePath("/admin/users");
  return { success: `Usuario asignado al equipo "${team.name}"` };
}
