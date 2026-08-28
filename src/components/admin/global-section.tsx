import { GlobalClient } from "@/components/admin/global-client";
import { GlobalSideNav, GlobalBottomNav } from "@/components/admin/global-nav";
import { GlobalTopBar } from "@/components/admin/global-top-bar";
import type { ReactNode } from "react";

export function GlobalSection({
  user,
  title,
  subtitle,
  basePath = "/superadmin",
  roleText = "Superadministrador",
  children,
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  title: string;
  subtitle: string;
  basePath?: string;
  roleText?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full">
      {/* Global stadium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/img/back/backstad.webp)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050606]/70 via-[#050606]/85 to-[#050606]" />
      </div>

      <GlobalSideNav user={user} basePath={basePath} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <GlobalTopBar user={user} title={title} roleText={roleText} />

        <main className="flex-1 px-6 pb-6 max-md:px-4 max-md:pb-28">
          <div className="mx-auto max-w-5xl">
            {children ?? <GlobalClient hero={{ title, subtitle }} />}
          </div>
        </main>
      </div>

      <GlobalBottomNav basePath={basePath} />
    </div>
  );
}
