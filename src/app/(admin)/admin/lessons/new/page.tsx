import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonEditor } from "@/components/admin/lesson-editor";

export const metadata = { title: "Nueva lección | Admin" };

export default async function AdminNewLessonPage() {
  await requireAdmin();

  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: { temas: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/lessons"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a lecciones
      </Link>
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Nueva lección</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Crea una lección, quiz o juego con sus preguntas y asíguala a un tema. Se proyecta en la app al guardar.
        </p>
      </div>
      <LessonEditor clases={clases} />
    </div>
  );
}
