import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Administradores | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Administradores"
      subtitle="Equipo con acceso de administración."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
