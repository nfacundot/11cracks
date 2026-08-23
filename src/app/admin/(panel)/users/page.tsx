import { requireSection, hasRole } from "@/lib/auth";
import { UsersView } from "@/components/admin/sections/users-view";

export const metadata = { title: "Usuarios | Admin" };

export default async function AdminUsersPage() {
  const user = await requireSection("ADMIN");
  return <UsersView viewerIsSuperadmin={hasRole(user.role, "SUPERADMIN")} />;
}
