import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { requireSection } from "@/lib/auth";
import { parseAvatarConfig, DEFAULT_AVATAR_CONFIG } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import { PlayerStage } from "@/components/player/player-stage";
import { WorldDesktop } from "@/components/goal50/world-desktop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mi mundo",
};

export default async function WorldPage() {
  const user = await requireSection("JUGADOR");
  const config = parseAvatarConfig(user.avatarConfig);

  const pet = await prisma.petContribution.aggregate({
    where: { playerId: user.id },
    _sum: { bottlesCount: true, estimatedKg: true },
  });
  const bottles = pet._sum.bottlesCount ?? 0;
  const kg = Number(pet._sum.estimatedKg ?? 0);

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    select: { team: { select: { name: true, logoUrl: true } } },
  });

  const rawNeeds = user.needs && typeof user.needs === "object" && !Array.isArray(user.needs)
    ? (user.needs as Record<string, unknown>)
    : {};
  const needs: Partial<Record<"oral" | "hygiene" | "hunger" | "thirst" | "bladder", number>> = {};
  for (const key of ["oral", "hygiene", "hunger", "thirst", "bladder"] as const) {
    const value = rawNeeds[key];
    if (typeof value === "number" && Number.isFinite(value)) needs[key] = value;
  }

  return (
    <>
      <PlayerStage
        config={config}
        self={{
          id: user.id,
          name: user.name,
          username: user.username,
          teamName: membership?.team.name ?? null,
          teamLogoUrl: membership?.team.logoUrl ?? null,
        }}
      />
      <WorldDesktop
        fontClassName={`${inter.variable} ${oswald.variable}`}
        streak={user.currentStreak}
        coins={user.coins}
        energy={user.energy}
        bottles={bottles}
        kg={kg}
        needs={needs}
        profile={{
          name: user.name,
          email: user.email,
          role: String(user.role),
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          position: user.position,
          favoriteTeam: user.favoriteTeam,
          country: user.country,
          avatarConfig: config ?? DEFAULT_AVATAR_CONFIG,
        }}
      />
    </>
  );
}
