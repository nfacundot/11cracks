import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
