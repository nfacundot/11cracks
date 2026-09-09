import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Billetera Solidaria | Admin" };

export default async function DemoWalletPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="wallet" />;
}
