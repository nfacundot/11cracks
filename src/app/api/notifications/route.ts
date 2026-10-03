import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      icon: true,
      link: true,
      read: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    notifications: rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
  });
}
