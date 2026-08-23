import { NewLessonView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Nueva leccion | Superadmin" };

export default function SuperadminNewLessonPage() {
  return <NewLessonView basePath="/superadmin" />;
}
