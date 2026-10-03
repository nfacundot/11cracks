import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NEED_KEYS } from "@/lib/needs-meta";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({ where: { id: user.id }, select: { needs: true } });
  const base = current?.needs && typeof current.needs === "object" && !Array.isArray(current.needs)
    ? { ...(current.needs as Record<string, unknown>) }
    : {};

  for (const key of NEED_KEYS) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      base[key] = Math.max(0, Math.min(100, Math.round(value * 10) / 10));
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { needs: base as Prisma.InputJsonValue } });

  return NextResponse.json({ needs: base });
}
