import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Impacto | Admin" };

export default async function DemoImpactPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="impact" />;
}
