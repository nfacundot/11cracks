import { LessonsView } from "@/components/admin/sections/lessons-view";

export const metadata = { title: "Lecciones | Admin" };

export default async function AdminLessonsPage({ searchParams: sp }: { searchParams: Promise<{ type?: string; materia?: string }> }) {
  const searchParams = await sp;
  return <LessonsView basePath="/admin" searchParams={searchParams} />;
}
