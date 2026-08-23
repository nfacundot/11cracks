import { requireUser } from "@/lib/auth";
import { ConfiguracionView } from "@/components/admin/sections/configuracion-view";

export const metadata = { title: "Configuración" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <ConfiguracionView />
    </div>
  );
}