import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Billetera | Superadmin" };

export default async function Page() {
  const user = await requireSection("SUPERADMIN");
  return <GlobalSection user={user} title="Billetera" subtitle="Saldos y movimientos de la red." />;
}
