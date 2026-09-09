import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Class Economy | Admin" };

export default async function DemoEconomyPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="economy" />;
}
