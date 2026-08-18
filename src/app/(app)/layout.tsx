import { requireUser } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";
import { SideNav } from "@/components/side-nav";
import { LoadingScreen } from "@/components/loading-screen";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh w-full">
      <LoadingScreen />
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 px-6 pt-6 pb-6 max-md:px-4 max-md:pt-4 max-md:pb-28">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
