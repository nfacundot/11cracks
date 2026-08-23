import { GlobalClient } from "@/components/admin/global-client";
import { GlobalSideNav, GlobalBottomNav } from "@/components/admin/global-nav";
import { GlobalTopBar } from "@/components/admin/global-top-bar";
import { CleanUrl } from "@/components/admin/clean-url";

export function GlobalDashboard({
  user,
  basePath = "/superadmin",
  roleText = "Superadministrador",
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  basePath?: string;
  roleText?: string;
}) {
  return (
    <div className="relative flex min-h-dvh w-full">
      <CleanUrl base={basePath} />
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
        <GlobalTopBar user={user} roleText={roleText} />

        <main className="flex-1 px-6 pb-6 max-md:px-4 max-md:pb-28">
          <div className="mx-auto max-w-5xl">
            <GlobalClient basePath={basePath} />
          </div>
        </main>
      </div>

      <GlobalBottomNav basePath={basePath} />
    </div>
  );
}
