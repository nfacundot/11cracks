import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FriendRelation } from "@/lib/friends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ status: "none" satisfies FriendRelation, valid: false });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId || userId === me.id) {
    return NextResponse.json({ status: "none" satisfies FriendRelation, valid: false });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ status: "none" satisfies FriendRelation, valid: false });
  }

  const [forward, reverse] = await Promise.all([
    prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: me.id, addresseeId: userId } },
      select: { status: true },
    }),
    prisma.friendship.findUnique({
      where: { requesterId_addresseeId: { requesterId: userId, addresseeId: me.id } },
      select: { status: true },
    }),
  ]);

  let status: FriendRelation = "none";
  if (forward?.status === "ACCEPTED" || reverse?.status === "ACCEPTED") status = "friends";
  else if (forward) status = "outgoing";
  else if (reverse) status = "incoming";

  return NextResponse.json({ status, valid: true });
}
