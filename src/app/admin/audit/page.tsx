import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Auditoría | Admin" };

export default async function DemoAuditPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="audit" />;
}
