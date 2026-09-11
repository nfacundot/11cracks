import "server-only";

import { prisma } from "@/lib/prisma";
import { assertInScope, scopesFor } from "@/lib/domain-scope";
import type { SessionUser } from "@/lib/auth";
import {
  isAttendanceStatus,
  sessionDateOf,
  sessionIdFor,
  sessionLabelOf,
  type AttendanceStatus,
} from "@/domain/attendance/attendance-contract";

export { isAttendanceStatus, sessionDateOf, sessionIdFor, sessionLabelOf };
export type { AttendanceStatus } from "@/domain/attendance/attendance-contract";

export interface Attendee {
  id: string;
  name: string;
}

export interface AttendanceScope {
  clubId: string;
  clubName: string;
  players: Attendee[];
}

export interface AttendanceSession {
  sessionId: string;
  label: string;
  date: string;
  recordCount: number;
  lastMarkedAt: Date | null;
}

export interface AttendanceWorkspace {
  scopes: AttendanceScope[];
  sessions: AttendanceSession[];
  records: { sessionId: string; playerId: string; status: AttendanceStatus; markedAt: Date | null }[];
}

export async function getAttendanceWorkspace(user: SessionUser): Promise<AttendanceWorkspace> {
  const scopes = await scopesFor(user);

  const players = scopes.flatMap((scope) =>
    scope.playerIds.map((playerId) => ({ clubId: scope.clubId, playerId }))
  );
  const scopesFlat = scopes;

  const playerIds = [...new Set(players.map((entry) => entry.playerId))];
  const users = playerIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } })
    : [];
  const userName = new Map(users.map((user) => [user.id, user.name]));

  const clubIds = scopesFlat.map((scope) => scope.clubId);
  const records = clubIds.length > 0
    ? await prisma.attendanceRecord.findMany({
        where: { clubId: { in: clubIds } },
        select: { sessionId: true, playerId: true, status: true, markedAt: true, createdAt: true },
      })
    : [];

  const bySession = new Map<string, AttendanceSession>();
  for (const record of records) {
    const existing = bySession.get(record.sessionId);
    if (!existing || existing.lastMarkedAt === null || (record.createdAt > existing.lastMarkedAt)) {
      bySession.set(record.sessionId, {
        sessionId: record.sessionId,
        label: sessionLabelOf(record.sessionId),
        date: sessionDateOf(record.sessionId),
        recordCount: 0,
        lastMarkedAt: record.createdAt,
      });
    }
  }
  for (const record of records) {
    const session = bySession.get(record.sessionId);
    if (session) session.recordCount += 1;
  }
  const sessions = [...bySession.values()].sort((a, b) =>
    (b.lastMarkedAt?.getTime() ?? 0) - (a.lastMarkedAt?.getTime() ?? 0)
  );

  return {
    scopes: scopesFlat.map((scope) => ({
      clubId: scope.clubId,
      clubName: scope.clubName,
      players: scope.playerIds
        .map((playerId) => ({ id: playerId, name: userName.get(playerId) ?? "Sin nombre" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })),
    sessions,
    records: records.map((record) => ({
      sessionId: record.sessionId,
      playerId: record.playerId,
      status: record.status,
      markedAt: record.markedAt,
    })),
  };
}

export async function saveSessionAttendance(params: {
  actor: SessionUser;
  clubId: string;
  sessionId: string;
  entries: { playerId: string; status: AttendanceStatus }[];
}): Promise<{ sessionId: string; saved: number }> {
  const scope = await assertInScope(params.actor, params.clubId);

  const uniquePlayers = [...new Set(params.entries.map((entry) => entry.playerId))];
  if (uniquePlayers.length !== params.entries.length) {
    throw new Error("Hay jugadores duplicados en la sesión.");
  }

  const knownPlayerIds = new Set(scope.playerIds);
  for (const entry of params.entries) {
    if (!knownPlayerIds.has(entry.playerId)) {
      throw new Error("Fuera de scope: la sesión incluye jugadores que no pertenecen a tu equipo.");
    }
    if (!isAttendanceStatus(entry.status)) {
      throw new Error(`Estado de asistencia no válido: ${entry.status}`);
    }
  }

  const now = new Date();
  let saved = 0;
  await prisma.$transaction(
    params.entries.map((entry) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_playerId: { sessionId: params.sessionId, playerId: entry.playerId },
        },
        update: {
          status: entry.status,
          markedAt: now,
          notes: null,
          clubId: params.clubId,
        },
        create: {
          clubId: params.clubId,
          sessionId: params.sessionId,
          playerId: entry.playerId,
          coachId: params.actor.id,
          status: entry.status,
          markedAt: now,
        },
      })
    )
  ).then((results) => {
    saved = results.length;
  });

  return { sessionId: params.sessionId, saved };
}