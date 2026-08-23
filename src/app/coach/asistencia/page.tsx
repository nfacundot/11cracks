import { requireSection } from "@/lib/auth";
import { AsistenciaView } from "@/components/admin/sections/asistencia-view";

export const metadata = { title: "Asistencia | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <AsistenciaView />
    </div>
  );
}