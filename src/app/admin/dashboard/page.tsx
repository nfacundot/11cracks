import { requireSection } from "@/lib/auth";
import { GlobalDashboard } from "@/components/admin/global-dashboard";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminDashboardPage() {
  const user = await requireSection("ADMIN");

  return (
    <GlobalDashboard
      user={{
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl ?? null,
      }}
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
