import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ count });
}