import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Tarjetas | Admin" };

export default async function DemoCardsPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="cards" />;
}
