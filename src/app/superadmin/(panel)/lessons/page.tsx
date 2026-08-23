import { LessonsView } from "@/components/admin/sections/lessons-view";

export const metadata = { title: "Lecciones | Superadmin" };

export default async function SuperadminLessonsPage({ searchParams: sp }: { searchParams: Promise<{ type?: string; materia?: string }> }) {
  const searchParams = await sp;
  return <LessonsView basePath="/superadmin" searchParams={searchParams} />;
}
