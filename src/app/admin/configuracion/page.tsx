import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { PerfilCuentaView } from "@/components/admin/sections/perfil-cuenta-view";

export const metadata = { title: "Configuración | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Configuración"
      subtitle="Preferencias de tu cuenta."
      basePath="/admin"
      roleText="Administrador"
    >
      <PerfilCuentaView title="Configuración" user={{ name: user.name, role: user.role }} />
    </GlobalSection>
  );
}