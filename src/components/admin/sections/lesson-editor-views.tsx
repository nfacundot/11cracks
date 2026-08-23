import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonEditor } from "@/components/admin/lesson-editor";

async function getClases() {
  return prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: { temas: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
  });
}

function BackLink({ basePath, label }: { basePath: string; label: string }) {
  return (
    <Link
      href={`${basePath}/${label === "juegos" ? "juegos" : "lessons"}`}
      className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Volver a {label}
    </Link>
  );
}

export async function NewLessonView({ basePath }: { basePath: string }) {
  const clases = await getClases();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink basePath={basePath} label="lecciones" />
      <LessonEditor clases={clases} />
    </div>
  );
}

export async function EditLessonView({
  basePath,
  id,
}: {
  basePath: string;
  id: string;
}) {
  const [lesson, clases] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    }),
    getClases(),
  ]);

  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink basePath={basePath} label="lecciones" />
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Editar: {lesson.title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Modifica la ficha y las preguntas. Los cambios se reflejan de inmediato en la app.
        </p>
      </div>
      <LessonEditor
        clases={clases}
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
          temaId: lesson.temaId,
        }}
        questions={lesson.questions
          .filter(
            (q): q is (typeof q & { type: "MULTIPLE_CHOICE" | "TRUE_FALSE" }) =>
              q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE"
          )
          .map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation,
            timeSeconds: q.timeSeconds,
            options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
          }))}
      />
    </div>
  );
}

export async function NewGameView({ basePath }: { basePath: string }) {
  const clases = await getClases();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink basePath={basePath} label="juegos" />
      <LessonEditor clases={clases} mode="games" />
    </div>
  );
}

export async function EditGameView({
  basePath,
  id,
}: {
  basePath: string;
  id: string;
}) {
  const [lesson, clases] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    }),
    getClases(),
  ]);

  if (!lesson || lesson.type !== "GAME") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink basePath={basePath} label="juegos" />
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Editar juego: {lesson.title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Modifica la ficha y las preguntas. Los cambios se reflejan de inmediato en la app.
        </p>
      </div>
      <LessonEditor
        clases={clases}
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
          temaId: lesson.temaId,
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
