"use client";

import { CoachSideNav, CoachBottomNav } from "@/components/admin/coach-nav";
import { GlobalTopBar } from "@/components/admin/global-top-bar";

export function CoachShell({
  user,
  team = null,
  children,
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  team?: { name: string; logoUrl: string | null } | null;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/img/back/backstad.webp)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050606]/70 via-[#050606]/85 to-[#050606]" />
      </div>

      <CoachSideNav user={user} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <GlobalTopBar
          user={{
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl ?? null,
            role: "ENTRENADOR",
          }}
          title="Panel de entrenador"
          roleText="Entrenador"
          team={team}
        />

        <main className="flex-1 px-6 pb-6 max-md:px-4 max-md:pb-28">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <CoachBottomNav />
    </div>
  );
}