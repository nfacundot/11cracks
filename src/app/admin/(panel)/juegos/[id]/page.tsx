import { EditGameView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Editar juego | Admin" };

export default async function AdminEditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGameView basePath="/admin" id={id} />;
}
