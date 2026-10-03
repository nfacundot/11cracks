import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getNeurocracksData } from "@/lib/el-camino/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await getNeurocracksData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("neurocracks GET error", error);
    return NextResponse.json({ error: "Error al cargar El Camino" }, { status: 500 });
  }
}
