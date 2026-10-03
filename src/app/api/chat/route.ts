import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_BODY = 500;
const LIMIT = 60;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rows = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true } },
      },
    });

    const messages = rows.reverse().map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ me: user.id, messages });
  } catch (error) {
    console.error("chat GET error", error);
    return NextResponse.json({ error: "Error al leer el chat" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { body?: unknown };
  try {
    payload = (await request.json()) as { body?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const text = typeof payload.body === "string" ? payload.body.trim().slice(0, MAX_BODY) : "";
  if (!text) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  try {
    const created = await prisma.chatMessage.create({
      data: { userId: user.id, body: text },
      select: { id: true, body: true, createdAt: true, userId: true },
    });

    return NextResponse.json({
      message: {
        id: created.id,
        userId: created.userId,
        name: user.name,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("chat POST error", error);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
