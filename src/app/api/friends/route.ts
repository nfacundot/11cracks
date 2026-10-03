import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FRIEND_USER_SELECT, toFriendUser, type FriendUser } from "@/lib/friends";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ friends: [], incoming: [], outgoing: [] });
  }

  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: me.id }, { addresseeId: me.id }] },
    include: {
      requester: { select: FRIEND_USER_SELECT },
      addressee: { select: FRIEND_USER_SELECT },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friends: FriendUser[] = [];
  const incoming: FriendUser[] = [];
  const outgoing: FriendUser[] = [];

  for (const row of rows) {
    const other = row.requesterId === me.id ? row.addressee : row.requester;
    const entry = toFriendUser(other, row.updatedAt);
    if (row.status === "ACCEPTED") friends.push(entry);
    else if (row.addresseeId === me.id) incoming.push(entry);
    else outgoing.push(entry);
  }

  return NextResponse.json({ friends, incoming, outgoing });
}

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { userId?: unknown; action?: unknown };
  try {
    payload = (await request.json()) as { userId?: unknown; action?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const userId = typeof payload.userId === "string" ? payload.userId : "";
  if (!userId || userId === me.id) {
    return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const [forward, reverse] = await Promise.all([
    prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: me.id, addresseeId: userId } },
    }),
    prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: userId, addresseeId: me.id } },
    }),
  ]);

  // Aceptar una solicitud (propia o inversa).
  if (payload.action === "accept") {
    if (reverse && reverse.status === "PENDING") {
      await prisma.friendship.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } });
    } else if (!forward) {
      await prisma.friendship.create({
        data: { requesterId: me.id, addresseeId: userId, status: "ACCEPTED" },
      });
    }
    return NextResponse.json({ status: "friends" });
  }

  // Enviar solicitud (o aceptar si la otra persona ya la envió).
  if (forward) {
    return NextResponse.json({ status: forward.status === "ACCEPTED" ? "friends" : "outgoing" });
  }
  if (reverse) {
    await prisma.friendship.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } });
    return NextResponse.json({ status: "friends" });
  }

  await prisma.friendship.create({ data: { requesterId: me.id, addresseeId: userId } });
  return NextResponse.json({ status: "outgoing" });
}

export async function DELETE(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: userId },
        { requesterId: userId, addresseeId: me.id },
      ],
    },
  });

  return NextResponse.json({ status: "none" });
}
