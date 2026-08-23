import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Permisos | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Permisos"
      subtitle="Roles y alcances de acceso en la red."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
