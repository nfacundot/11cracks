import { AsignaturasView } from "@/components/admin/sections/asignaturas-view";

export const metadata = { title: "Temas | Admin" };

export default function AdminAsignaturasPage() {
  return <AsignaturasView basePath="/admin" />;
}
