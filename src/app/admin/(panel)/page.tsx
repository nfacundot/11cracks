import { requireSection } from "@/lib/auth";
import { AdminWorkspace } from "@/components/admin-demo/admin-workspace";
import { adminIdentity } from "@/lib/admin-demo/state";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminIndexPage() {
  await requireSection("ADMIN");
  return <AdminWorkspace identity={adminIdentity} section="dashboard" />;
}
