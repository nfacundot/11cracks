import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { PerfilCuentaView } from "@/components/admin/sections/perfil-cuenta-view";

export const metadata = { title: "Perfil | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Perfil"
      subtitle="Tu cuenta de administrador."
      basePath="/admin"
      roleText="Administrador"
    >
      <PerfilCuentaView title="Perfil" user={{ name: user.name, role: user.role }} />
    </GlobalSection>
  );
}