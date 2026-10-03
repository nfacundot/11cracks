import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanMessageBody } from "@/lib/direct-messages";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ conversations: [] });
  }

  const rows = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me.id }, { recipientId: me.id }] },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: { id: true, senderId: true, recipientId: true, body: true, read: true, createdAt: true },
  });

  const map = new Map<string, { lastMessage: string; lastAt: Date; unread: number }>();
  for (const row of rows) {
    const other = row.senderId === me.id ? row.recipientId : row.senderId;
    let entry = map.get(other);
    if (!entry) {
      entry = { lastMessage: row.body, lastAt: row.createdAt, unread: 0 };
      map.set(other, entry);
    }
    if (row.recipientId === me.id && !row.read) entry.unread += 1;
  }

  const ids = [...map.keys()];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          teamMembers: { select: { team: { select: { name: true, logoUrl: true } } }, take: 1 },
        },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const conversations = ids
    .map((id) => {
      const entry = map.get(id)!;
      const user = userMap.get(id);
      return {
        userId: id,
        name: user?.name ?? "Jugador",
        username: user?.username ?? "",
        avatarUrl: user?.avatarUrl ?? null,
        teamName: user?.teamMembers[0]?.team.name ?? null,
        teamLogoUrl: user?.teamMembers[0]?.team.logoUrl ?? null,
        lastMessage: entry.lastMessage,
        lastAt: entry.lastAt.toISOString(),
        unread: entry.unread,
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { toUserId?: unknown; body?: unknown };
  try {
    payload = (await request.json()) as { toUserId?: unknown; body?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const toUserId = typeof payload.toUserId === "string" ? payload.toUserId : "";
  const body = cleanMessageBody(payload.body);
  if (!body) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }
  if (!toUserId || toUserId === me.id) {
    return NextResponse.json({ error: "Destinatario no válido" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
  if (!recipient) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const created = await prisma.directMessage.create({
    data: { senderId: me.id, recipientId: toUserId, body },
    select: { id: true, senderId: true, recipientId: true, body: true, read: true, createdAt: true },
  });

  return NextResponse.json({ message: { ...created, createdAt: created.createdAt.toISOString() } });
}

export async function DELETE(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  await prisma.directMessage.deleteMany({
    where: { id, OR: [{ senderId: me.id }, { recipientId: me.id }] },
  });

  return NextResponse.json({ ok: true });
}
