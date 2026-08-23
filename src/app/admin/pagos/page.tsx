import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { AdminDashboardBody } from "@/components/admin/global-client";

export const metadata = { title: "Pagos | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Pagos"
      subtitle="Cobros y transacciones de la plataforma."
      basePath="/admin"
      roleText="Administrador"
    >
      <AdminDashboardBody title="Pagos" />
    </GlobalSection>
  );
}
