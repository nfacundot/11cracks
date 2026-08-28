import { requireSection } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/shell/navigation";
import { AppShell, type ShellUser } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("ADMIN");

  const shellUser: ShellUser = {
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: "admin",
    scopeLabel: "Administración",
  };

  return (
    <AppShell user={shellUser} groups={getNavigationForRole("admin")}>
      {children}
    </AppShell>
  );
}
