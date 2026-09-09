import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Perfil | Admin" };

export default async function DemoProfilePage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="profile" />;
}
