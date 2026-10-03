import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { inventory: true } });
  return NextResponse.json({ slots: parseInventory(row?.inventory) });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { slots?: unknown };
  try {
    payload = (await request.json()) as { slots?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const slots = parseInventory(payload.slots);
  await prisma.user.update({ where: { id: user.id }, data: { inventory: slots as unknown as Prisma.InputJsonValue } });

  return NextResponse.json({ slots });
}
