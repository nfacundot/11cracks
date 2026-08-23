import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { CertificacionesView } from "@/components/admin/sections/certificaciones-view";

export const metadata = { title: "Certificaciones | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Certificaciones y horas"
      subtitle="Certificaciones de tu organización."
      basePath="/admin"
      roleText="Administrador"
    >
      <CertificacionesView />
    </GlobalSection>
  );
}
