import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { AdminDashboardBody } from "@/components/admin/global-client";

export const metadata = { title: "Postulaciones | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Postulaciones"
      subtitle="Postulaciones de tu organización."
      basePath="/admin"
      roleText="Administrador"
    >
      <AdminDashboardBody title="Postulaciones" />
    </GlobalSection>
  );
}