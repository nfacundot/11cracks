import { requireSection } from "@/lib/auth";
import { UsersView } from "@/components/admin/sections/users-view";

export const metadata = { title: "Usuarios | Superadmin" };

export default async function SuperadminUsersPage() {
  await requireSection("SUPERADMIN");
  return <UsersView viewerIsSuperadmin={true} />;
}
