import { NewLessonView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Nueva leccion | Admin" };

export default function AdminNewLessonPage() {
  return <NewLessonView basePath="/admin" />;
}
