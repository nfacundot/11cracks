import { requireSection } from "@/lib/auth";
import { getCoinsWorkspace } from "@/lib/coins/service";
import { CoinsWorkspace } from "@/components/admin/coins-workspace";

export const metadata = { title: "Crack Coins | Admin" };

export default async function CoinsPage() {
  const user = await requireSection("ADMIN");
  const view = await getCoinsWorkspace(user);
  return <CoinsWorkspace view={view} />;
}