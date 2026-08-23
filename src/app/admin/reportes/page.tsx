import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { ReportesView } from "@/components/admin/sections/reportes-view";

export const metadata = { title: "Reportes | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Reportes"
      subtitle="Reportes de tu organización."
      basePath="/admin"
      roleText="Administrador"
    >
      <ReportesView />
    </GlobalSection>
  );
}
