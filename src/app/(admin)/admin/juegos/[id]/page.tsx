import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonEditor } from "@/components/admin/lesson-editor";

export const metadata = { title: "Editar juego | Admin" };

export default async function AdminEditJuegoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [lesson, etapas] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    }),
    prisma.etapa.findMany({
      orderBy: { order: "asc" },
      include: { materias: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
    }),
  ]);

  if (!lesson || lesson.type !== "GAME") notFound();

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
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Editar juego: {lesson.title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Modifica la ficha y las preguntas. Los cambios se reflejan de inmediato en la app.
        </p>
      </div>
      <LessonEditor
        etapas={etapas}
        mode="games"
        defaultValues={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          emoji: lesson.emoji,
          color: lesson.color,
          type: lesson.type,
          gameMode: lesson.gameMode,
          order: lesson.order,
          xpReward: lesson.xpReward,
          materiaId: lesson.materiaId,
        }}
        questions={lesson.questions
          .filter(
            (q): q is typeof q & { type: "MULTIPLE_CHOICE" | "TRUE_FALSE" } =>
              q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"
          )
          .map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            timeSeconds: q.timeSeconds,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              imageUrl: o.imageUrl,
              isCorrect: o.isCorrect,
            })),
          }))}
      />
    </div>
  );
}
