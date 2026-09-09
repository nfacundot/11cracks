import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Recompensas | Admin" };

export default async function DemoRewardsPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="cards" />;
}
