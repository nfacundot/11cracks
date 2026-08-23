import { CaminosView } from "@/components/admin/sections/caminos-view";

export const metadata = { title: "Caminos | Superadmin" };

export default function SuperadminCaminosPage() {
  return <CaminosView basePath="/superadmin" />;
}
