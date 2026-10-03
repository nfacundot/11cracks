import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FRIEND_USER_SELECT,
  toFriendUser,
  type FriendRelation,
} from "@/lib/friends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ results: [] });
  }

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      role: "JUGADOR",
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { xp: "desc" },
    take: 12,
    select: FRIEND_USER_SELECT,
  });

  const ids = users.map((user) => user.id);
  const rows = ids.length
    ? await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: me.id, addresseeId: { in: ids } },
            { addresseeId: me.id, requesterId: { in: ids } },
          ],
        },
        select: { requesterId: true, addresseeId: true, status: true },
      })
    : [];

  const relations = new Map<string, FriendRelation>();
  for (const row of rows) {
    const other = row.requesterId === me.id ? row.addresseeId : row.requesterId;
    if (row.status === "ACCEPTED") relations.set(other, "friends");
    else relations.set(other, row.requesterId === me.id ? "outgoing" : "incoming");
  }

  const now = Date.now();
  const results = users.map((user) => ({
    ...toFriendUser(user, new Date(), now),
    status: relations.get(user.id) ?? "none",
  }));

  return NextResponse.json({ results });
}
