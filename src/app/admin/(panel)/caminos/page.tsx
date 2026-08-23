import { CaminosView } from "@/components/admin/sections/caminos-view";

export const metadata = { title: "Caminos | Admin" };

export default function AdminCaminosPage() {
  return <CaminosView basePath="/admin" />;
}
