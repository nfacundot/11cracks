import { requireSection } from "@/lib/auth";
import { UsersView } from "@/components/admin/sections/users-view";

export const metadata = { title: "Usuarios | Superadmin" };

export default async function SuperadminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { page = "1", pageSize = "10" } = await searchParams;
  await requireSection("SUPERADMIN");
  return <UsersView viewerIsSuperadmin={true} page={Number(page)} pageSize={Number(pageSize)} />;
}