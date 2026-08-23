import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { UsuariosView } from "@/components/admin/sections/usuarios-view";

export const metadata = { title: "Usuarios | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Usuarios"
      subtitle="Personas registradas en la plataforma."
      basePath="/admin"
      roleText="Administrador"
    >
      <UsuariosView />
    </GlobalSection>
  );
}
