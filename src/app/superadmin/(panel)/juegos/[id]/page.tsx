import { EditGameView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Editar juego | Superadmin" };

export default async function SuperadminEditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGameView basePath="/superadmin" id={id} />;
}
