import { JuegosView } from "@/components/admin/sections/juegos-view";

export const metadata = { title: "Juegos | Superadmin" };

export default function SuperadminJuegosPage() {
  return <JuegosView basePath="/superadmin" />;
}
