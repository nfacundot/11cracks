import { requireSection } from "@/lib/auth";
import { EquipoView } from "@/components/admin/sections/equipo-view";

export const metadata = { title: "Equipo | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <EquipoView />
    </div>
  );
}