import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Pagos | Superadmin" };

export default async function Page() {
  const user = await requireSection("SUPERADMIN");
  return <GlobalSection user={user} title="Pagos" subtitle="Cobros y transacciones de la plataforma." />;
}
