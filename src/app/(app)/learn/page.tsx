import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CheckIcon, LockIcon } from "@/components/icons";

export const metadata = { title: "Aprender" };

const typeLabel: Record<string, string> = {
  LESSON: "Lección",
  QUIZ: "Quiz",
  GAME: "Juego",
  TRAINING: "Entrenamiento",
};

export default async function LearnPage() {
  const user = await requireUser();

  const stages = await prisma.stage.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          questions: { select: { id: true } },
          progress: { where: { userId: user.id } },
        },
      },
    },
  });

  const allLessons = stages.flatMap((s) => s.lessons);
  const firstIncompleteIndex = allLessons.findIndex((l) => !l.progress[0]?.completed);

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-black">Tu camino</h1>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
          {allLessons.filter((l) => l.progress[0]?.completed).length}/{allLessons.length}
        </span>
      </header>

      {stages.map((stage, stageIndex) => {
        const stageLessons = stage.lessons;
        const stageCompleted = stageLessons.filter((l) => l.progress[0]?.completed).length;
        const stageDone = stageCompleted === stageLessons.length;

        return (
          <section key={stage.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-green-100">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                  stageDone ? "bg-green-500/15" : "bg-zinc-100"
                }`}
              >
                {stage.emoji}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                  Etapa {stageIndex + 1}
                </p>
                <h2 className="font-black leading-tight">{stage.title}</h2>
              </div>
              <div className="flex gap-1">
                {stageLessons.map((l) => (
                  <span
                    key={l.id}
                    className={`h-1.5 w-4 rounded-full ${
                      l.progress[0]?.completed ? "bg-green-500" : "bg-zinc-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative flex flex-col items-center">
              {stageLessons.map((lesson, i) => {
                const progress = lesson.progress[0];
                const completed = progress?.completed;
                const isNext = allLessons.indexOf(lesson) === firstIncompleteIndex;
                const locked = !completed && !isNext && allLessons.indexOf(lesson) > firstIncompleteIndex;

                return (
                  <div key={lesson.id} className="flex w-full flex-col items-center">
                    {i > 0 && (
                      <div
                        className={`h-7 w-1.5 rounded-full ${
                          completed ? "bg-green-400" : "bg-zinc-200"
                        }`}
                      />
                    )}

                    <Link
                      href={`/lesson/${lesson.id}`}
                      className={`group flex w-full items-center gap-4 rounded-3xl p-4 transition ${
                        isNext
                          ? "bg-emerald-950 text-white shadow-lg shadow-green-900/20 ring-2 ring-green-400"
                          : completed
                            ? "bg-white ring-1 ring-green-100 hover:shadow-md"
                            : "bg-white/60 ring-1 ring-zinc-200 hover:ring-green-300"
                      }`}
                    >
                      <div
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                        style={{
                          backgroundColor: isNext ? "#16a34a" : `${lesson.color}22`,
                        }}
                      >
                        {locked ? (
                          <LockIcon className="h-6 w-6 text-zinc-400" />
                        ) : (
                          lesson.emoji
                        )}
                        {completed && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                            <CheckIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {isNext && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-white">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            isNext ? "text-green-300" : "text-zinc-400"
                          }`}
                        >
                          {typeLabel[lesson.type] ?? "Lección"}
                        </p>
                        <h3 className="font-black leading-tight">{lesson.title}</h3>
                        <p
                          className={`text-xs ${isNext ? "text-green-100/70" : "text-zinc-500"}`}
                        >
                          {lesson.questions.length} preguntas · {lesson.xpReward} XP
                        </p>
                      </div>

                      {isNext && (
                        <span className="rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white">
                          {progress ? "Continuar" : "Empezar"}
                        </span>
                      )}
                      {completed && (
                        <span className="text-xs font-black text-green-500">
                          {progress?.bestScore}/{lesson.questions.length}
                        </span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
