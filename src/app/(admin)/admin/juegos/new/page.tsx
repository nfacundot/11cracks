import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonEditor } from "@/components/admin/lesson-editor";

export const metadata = { title: "Nuevo juego | Admin" };

export default async function AdminNewJuegoPage() {
  await requireAdmin();

  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: { temas: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/juegos"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a juegos
      </Link>
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Nuevo juego</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Crea un juego del administrador. Para <b>Infograma</b>: escribe una pregunta concreta y
          sube 4 imágenes (A, B, C, D); marca la correcta. Se juega en la app al guardar.
        </p>
      </div>
      <LessonEditor clases={clases} mode="games" />
    </div>
  );
}
