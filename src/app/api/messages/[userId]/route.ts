import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { userId } = await params;
  const peer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      teamMembers: { select: { team: { select: { name: true, logoUrl: true } } }, take: 1 },
    },
  });

  if (!peer) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  await prisma.directMessage.updateMany({
    where: { senderId: userId, recipientId: me.id, read: false },
    data: { read: true },
  });

  const rows = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: me.id, recipientId: userId },
        { senderId: userId, recipientId: me.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, recipientId: true, body: true, read: true, createdAt: true },
  });

  return NextResponse.json({
    me: me.id,
    peer: {
      id: peer.id,
      name: peer.name,
      username: peer.username,
      avatarUrl: peer.avatarUrl,
      teamName: peer.teamMembers[0]?.team.name ?? null,
      teamLogoUrl: peer.teamMembers[0]?.team.logoUrl ?? null,
    },
    messages: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
  });
}
