import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sponsors = await prisma.sponsor.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: 20,
    select: { id: true, name: true, imageUrl: true, slot: true },
  });

  return NextResponse.json({ sponsors });
}
