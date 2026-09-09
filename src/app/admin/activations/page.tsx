import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Activaciones e Impacto | Admin" };

export default async function DemoActivationsPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="activations" />;
}