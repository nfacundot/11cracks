import { requireSection } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/shell/navigation";
import { AppShell, type ShellUser } from "@/components/shell/app-shell";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("SUPERADMIN");

  const shellUser: ShellUser = {
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: "superadmin",
    scopeLabel: "Gobierno global",
  };

  return (
    <AppShell user={shellUser} groups={getNavigationForRole("superadmin")}>
      {children}
    </AppShell>
  );
}
