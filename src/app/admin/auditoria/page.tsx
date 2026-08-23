import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { AdminDashboardBody } from "@/components/admin/global-client";

export const metadata = { title: "Auditoría | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Auditoría"
      subtitle="Trazabilidad de acciones en la plataforma."
      basePath="/admin"
      roleText="Administrador"
    >
      <AdminDashboardBody title="Auditoría" />
    </GlobalSection>
  );
}