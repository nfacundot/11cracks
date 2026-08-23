import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { BilleteraView } from "@/components/admin/sections/billetera-view";

export const metadata = { title: "Impacto | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Billetera e impacto"
      subtitle="Saldos y movimientos de la red."
      basePath="/admin"
      roleText="Administrador"
    >
      <BilleteraView />
    </GlobalSection>
  );
}