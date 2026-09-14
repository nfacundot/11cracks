import { NextResponse } from "next/server";
import { getSessionUser, homeForRole } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, home: homeForRole(user.role) });
}