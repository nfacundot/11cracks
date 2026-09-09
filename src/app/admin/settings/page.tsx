import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Configuración | Admin" };

export default async function DemoSettingsPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="settings" />;
}
