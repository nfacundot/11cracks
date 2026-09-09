import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Datos de mascota | Admin" };

export default async function DemoPetPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="pet" />;
}
