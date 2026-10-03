import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.friendship.count({
    where: { addresseeId: me.id, status: "PENDING" },
  });

  return NextResponse.json({ count });
}
