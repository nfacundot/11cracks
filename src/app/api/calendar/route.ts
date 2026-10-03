import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCalendarEvents } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { calendarEvents: true } });
  return NextResponse.json({ events: parseCalendarEvents(row?.calendarEvents) });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { events?: unknown };
  try {
    payload = (await request.json()) as { events?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const events = parseCalendarEvents(payload.events);
  await prisma.user.update({ where: { id: user.id }, data: { calendarEvents: events as unknown as Prisma.InputJsonValue } });
  return NextResponse.json({ events });
}
