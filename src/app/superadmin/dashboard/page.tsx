import { requireSection } from "@/lib/auth";
import { GlobalDashboard } from "@/components/admin/global-dashboard";

export const metadata = { title: "Vista Global | Superadmin" };

export default async function SuperadminDashboardPage() {
  const user = await requireSection("SUPERADMIN");

  return (
    <GlobalDashboard
      user={{
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      }}
    />
  );
}
