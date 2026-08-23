import { requireSection } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";
import { CleanUrl } from "@/components/admin/clean-url";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("JUGADOR");

  return (
    <div className="relative flex min-h-dvh w-full">
      <CleanUrl base="/jugador" />

      {/* Global stadium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/img/back/backstad.webp)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050606]/70 via-[#050606]/85 to-[#050606]" />
      </div>

      <SideNav user={user} />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-6 pt-0 pb-6 max-md:px-4 max-md:pt-0 max-md:pb-28">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
