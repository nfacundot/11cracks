import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPlayerVideosWorkspace } from "@/lib/videos/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const videos = await getPlayerVideosWorkspace(user.id);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("videos GET error", error);
    return NextResponse.json({ error: "Error al cargar los videos" }, { status: 500 });
  }
}
