import { EditLessonView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Editar leccion | Admin" };

export default async function AdminEditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditLessonView basePath="/admin" id={id} />;
}
