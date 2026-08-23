import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Catálogos | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Catálogos"
      subtitle="Catálogos maestros de la plataforma."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
