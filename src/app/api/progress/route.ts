import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPlayerProgress } from "@/lib/player/progress-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await getPlayerProgress(user.id, user.currentStreak, user.bestStreak);
    return NextResponse.json(data);
  } catch (error) {
    console.error("progress GET error", error);
    return NextResponse.json({ error: "Error al cargar el progreso" }, { status: 500 });
  }
}
