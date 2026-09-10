import { requireSection } from "@/lib/auth";
import { UsersView } from "@/components/admin/sections/users-view";

export const metadata = { title: "Usuarios | Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { page = "1", pageSize = "10" } = await searchParams;
  const user = await requireSection("ADMIN");
  return (
    <UsersView
      viewerIsSuperadmin={user.role === "SUPERADMIN"}
      page={Number(page)}
      pageSize={Number(pageSize)}
    />
  );
}
