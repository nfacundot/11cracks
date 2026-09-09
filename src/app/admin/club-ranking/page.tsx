import { requireSection } from "@/lib/auth";
import { AdminDemoWindow } from "@/components/admin-demo/admin-windows";

export const metadata = { title: "Ranking de clubes | Admin" };

export default async function DemoClubRankingPage() {
  await requireSection("ADMIN");
  return <AdminDemoWindow section="club-ranking" />;
}