import { EditLessonView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Editar leccion | Superadmin" };

export default async function SuperadminEditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditLessonView basePath="/superadmin" id={id} />;
}
