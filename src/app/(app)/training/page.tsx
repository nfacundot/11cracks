import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CheckIcon, DumbbellIcon, TimerIcon } from "@/components/icons";

export const metadata = { title: "Entrenamiento" };

export default async function TrainingPage() {
  const user = await requireUser();

  const trainings = await prisma.lesson.findMany({
    where: { type: "TRAINING" },
    orderBy: { order: "asc" },
    include: {
      questions: { select: { id: true } },
      progress: { where: { userId: user.id } },
    },
  });

  const completed = trainings.filter((t) => t.progress[0]?.completed).length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Entrenamiento</h1>
          <p className="text-sm text-zinc-500">
            Sesiones de práctica para mejorar tu juego
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
          <DumbbellIcon className="h-6 w-6" />
        </div>
      </header>

      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 to-green-900 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wide text-green-300">
          Tu progreso
        </p>
        <p className="mt-1 text-2xl font-black">
          {completed}/{trainings.length} sesiones completadas
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{
              width: `${trainings.length ? Math.round((completed / trainings.length) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {trainings.map((training) => {
        const progress = training.progress[0];
        const done = progress?.completed;
        const estimated = training.questions.length * 3;

        return (
          <Link
            key={training.id}
            href={`/lesson/${training.id}`}
            className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${training.color}22` }}
            >
              {training.emoji}
            </div>
            <div className="flex-1">
              <h2 className="font-black">{training.title}</h2>
              <p className="line-clamp-1 text-sm text-zinc-500">
                {training.description}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-zinc-400">
                <TimerIcon className="h-3.5 w-3.5" />
                {estimated} min aprox · {training.xpReward} XP
              </p>
            </div>
            {done ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
            ) : (
              <span className="rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white transition group-hover:bg-green-600">
                Empezar
              </span>
            )}
          </Link>
        );
      })}

      {trainings.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-400">
          Aún no hay sesiones de entrenamiento.
        </p>
      )}
    </div>
  );
}
