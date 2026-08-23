import { CaminoDetailView } from "@/components/admin/sections/camino-detail-view";

export const metadata = { title: "Configurar camino | Admin" };

export default async function AdminCaminoDetailPage({ params }: { params: Promise<{ etapaId: string }> }) {
  const { etapaId } = await params;
  return <CaminoDetailView basePath="/admin" etapaId={etapaId} />;
}
