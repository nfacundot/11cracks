import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { energy?: unknown };
  try {
    payload = (await request.json()) as { energy?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (typeof payload.energy !== "number" || !Number.isFinite(payload.energy)) {
    return NextResponse.json({ error: "Energía inválida" }, { status: 400 });
  }

  const energy = Math.max(0, Math.min(100, Math.round(payload.energy * 10) / 10));
  await prisma.user.update({ where: { id: user.id }, data: { energy } });

  return NextResponse.json({ energy });
}
