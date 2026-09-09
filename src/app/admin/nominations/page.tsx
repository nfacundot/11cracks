import { requireSection } from "@/lib/auth";
import { AdminWorkspace } from "@/components/admin-demo/admin-workspace";
import { adminIdentity } from "@/lib/admin-demo/state";

export const metadata = { title: "Postulaciones | Admin" };

export default async function DemoNominationsPage() {
  await requireSection("ADMIN");
  return <AdminWorkspace identity={adminIdentity} section="nominations" />;
}
