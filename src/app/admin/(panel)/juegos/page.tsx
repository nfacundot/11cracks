import { JuegosView } from "@/components/admin/sections/juegos-view";

export const metadata = { title: "Juegos | Admin" };

export default function AdminJuegosPage() {
  return <JuegosView basePath="/admin" />;
}
