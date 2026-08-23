import { AsignaturasView } from "@/components/admin/sections/asignaturas-view";

export const metadata = { title: "Temas | Superadmin" };

export default function SuperadminAsignaturasPage() {
  return <AsignaturasView basePath="/superadmin" />;
}
