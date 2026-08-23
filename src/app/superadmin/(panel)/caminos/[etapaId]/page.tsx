import { CaminoDetailView } from "@/components/admin/sections/camino-detail-view";

export const metadata = { title: "Configurar camino | Superadmin" };

export default async function SuperadminCaminoDetailPage({ params }: { params: Promise<{ etapaId: string }> }) {
  const { etapaId } = await params;
  return <CaminoDetailView basePath="/superadmin" etapaId={etapaId} />;
}
