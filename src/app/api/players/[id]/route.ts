import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_CONFIG, parseAvatarConfig } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      avatarConfig: true,
      bio: true,
      position: true,
      favoriteTeam: true,
      country: true,
      role: true,
      xp: true,
      coins: true,
      trophies: true,
      currentStreak: true,
      teamMembers: {
        select: { team: { select: { name: true, logoUrl: true } } },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    player: {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      avatarConfig: parseAvatarConfig(user.avatarConfig) ?? DEFAULT_AVATAR_CONFIG,
      bio: user.bio,
      position: user.position,
      favoriteTeam: user.favoriteTeam,
      country: user.country,
      role: user.role,
      xp: user.xp,
      coins: user.coins,
      trophies: user.trophies,
      streak: user.currentStreak,
      teamName: user.teamMembers[0]?.team.name ?? null,
      teamLogoUrl: user.teamMembers[0]?.team.logoUrl ?? null,
    },
  });
}
