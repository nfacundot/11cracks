import { requireSection } from "@/lib/auth";
import { PerfilCuentaView } from "@/components/admin/sections/perfil-cuenta-view";

export const metadata = { title: "Configuración | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <PerfilCuentaView title="Configuración" user={{ name: user.name, role: user.role }} />
    </div>
  );
}