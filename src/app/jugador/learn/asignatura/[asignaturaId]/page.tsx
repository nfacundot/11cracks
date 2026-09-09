import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { LearnLessonList } from "@/components/learn-lesson-list";

export const metadata = { title: "Tema" };

export default async function LearnAsignaturaPage({
  params,
}: {
  params: Promise<{ asignaturaId: string }>;
}) {
  const user = await requireUser();
  const { asignaturaId } = await params;

  const tema = await prisma.tema.findUnique({
    where: { id: asignaturaId },
    include: {
      clases: { select: { id: true, name: true, emoji: true, color: true } },
      lessons: {
        orderBy: { order: "asc" },
        include: {
          questions: { select: { id: true } },
          progress: { where: { userId: user.id } },
        },
      },
    },
  });

  if (!tema) notFound();

  const lessons = tema.lessons;
  const completedCount = lessons.filter((l) => l.progress[0]?.completed).length;
  const firstIncompleteIndex = lessons.findIndex((l) => !l.progress[0]?.completed);

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-0 mx-auto max-w-md overflow-hidden">
      <Image
        src="/img/back/backa.webp"
        alt=""
        fill
        priority
        sizes="(max-width: 448px) 448px, 448px"
        className="object-cover"
      />

      <div className="absolute inset-x-0 top-[3.25rem] bottom-0 z-10 overflow-y-auto px-4 pb-8 pt-1">
        <Link
          href="/jugador/learn"
          className="mb-3 flex w-fit items-center gap-2 rounded-full bg-white/55 backdrop-blur-xl px-3 py-1.5 text-xs font-black text-emerald-950 shadow-xl ring-1 ring-white/70 dark:bg-emerald-950/55 dark:text-white dark:ring-emerald-800"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </Link>

        <div className="rounded-2xl bg-white/55 backdrop-blur-xl px-4 py-3 shadow-xl ring-2 ring-white/70 dark:bg-emerald-950/55 dark:ring-emerald-800">
          {tema.clases[0] && (
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: tema.clases[0].color }}>
              {tema.clases[0].emoji} {tema.clases[0].name}
            </p>
          )}
          <p className="text-sm font-black text-emerald-950 dark:text-white">
            {tema.emoji} {tema.name}
          </p>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {completedCount}/{lessons.length} lecciones completadas
          </p>
        </div>

        <LearnLessonList
          lessons={lessons}
          firstIncompleteIndex={firstIncompleteIndex}
        />
      </div>
    </div>
  );
}
