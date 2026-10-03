import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AVATAR_CONFIG, parseAvatarConfig } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ players: [] });
  }

  const users = await prisma.user.findMany({
    where: { role: "JUGADOR", id: { not: me.id } },
    orderBy: { xp: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      avatarConfig: true,
      xp: true,
      coins: true,
      currentStreak: true,
      teamMembers: {
        select: { team: { select: { name: true, logoUrl: true } } },
        take: 1,
      },
    },
  });

  const players = users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    avatarConfig: parseAvatarConfig(user.avatarConfig) ?? DEFAULT_AVATAR_CONFIG,
    xp: user.xp,
    coins: user.coins,
    streak: user.currentStreak,
    teamName: user.teamMembers[0]?.team.name ?? null,
    teamLogoUrl: user.teamMembers[0]?.team.logoUrl ?? null,
  }));

  return NextResponse.json({ players });
}
