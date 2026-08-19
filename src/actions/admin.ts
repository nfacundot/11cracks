"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type AdminState = { error?: string; success?: string } | undefined;

export type EditableLessonData = {
  defaultValues: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
    type: "LESSON" | "QUIZ" | "GAME";
    gameMode?: "ANAGRAM" | "INFOGRAMA" | null;
    order: number;
    xpReward: number;
    temaId?: string | null;
  };
  questions: {
    id: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    prompt: string;
    explanation: string | null;
    timeSeconds: number | null;
    options: { id: string; text: string; imageUrl?: string | null; isCorrect: boolean }[];
  }[];
};

export async function getEditableLesson(lessonId: string): Promise<EditableLessonData | null> {
  await requireAdmin();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!lesson) return null;

  return {
    defaultValues: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? "",
      emoji: lesson.emoji,
      color: lesson.color,
      type: lesson.type as EditableLessonData["defaultValues"]["type"],
      gameMode: lesson.gameMode as EditableLessonData["defaultValues"]["gameMode"],
      order: lesson.order,
      xpReward: lesson.xpReward,
      temaId: lesson.temaId,
    },
    questions: lesson.questions.map((q) => ({
      id: q.id,
      type: q.type as EditableLessonData["questions"][number]["type"],
      prompt: q.prompt,
      explanation: q.explanation,
      timeSeconds: q.timeSeconds,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        imageUrl: o.imageUrl ?? undefined,
        isCorrect: o.isCorrect,
      })),
    })),
  };
}

const ROLE_LABELS = {
  ADMIN: "Administrador",
  COACH: "Entrenador",
  PARENT: "Padre",
  STUDENT: "Estudiante",
} as const;

export async function setUserRole(userId: string, role: "ADMIN" | "COACH" | "PARENT" | "STUDENT") {
  await requireAdmin();

  if (!["ADMIN", "COACH", "PARENT", "STUDENT"].includes(role)) {
    return { error: "Rol inválido" };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: `Rol actualizado a ${ROLE_LABELS[role]}` };
}

export async function deleteUser(userId: string) {
  await requireAdmin();

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!me) return { error: "Usuario no encontrado" };
  if (me.email === "admin@gmail.com") {
    return { error: "No puedes eliminar la cuenta principal del administrador" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: "Usuario eliminado" };
}

export async function saveClase(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "🗺️").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));

  if (!name) return { error: "Escribe el nombre de la clase" };
  if (name.length > 60) return { error: "El nombre es demasiado largo" };

  if (id) {
    await prisma.clase.update({
      where: { id },
      data: { name, description: description || null, emoji, color, order },
    });
  } else {
    await prisma.clase.create({
      data: { name, description: description || null, emoji, color, order },
    });
  }

  revalidatePath("/admin/clases");
  revalidatePath("/admin/caminos");
  revalidatePath("/admin");
  revalidatePath("/learn");
  return { success: id ? "Clase actualizada" : "Clase creada" };
}

export async function deleteClase(claseId: string) {
  await requireAdmin();

  const temas = await prisma.tema.findMany({
    where: { claseId },
    select: { id: true },
  });
  if (temas.length > 0) {
    await prisma.tema.updateMany({
      where: { claseId },
      data: { claseId: null },
    });
  }

  await prisma.clase.delete({ where: { id: claseId } });

  revalidatePath("/admin/clases");
  revalidatePath("/admin");
  revalidatePath("/learn");
  return { success: "Clase eliminada" };
}

export async function saveTema(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const claseId = String(formData.get("claseId") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "⭐").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 0));

  if (!name) return { error: "Escribe el nombre del tema" };

  if (id) {
    await prisma.tema.update({
      where: { id },
      data: { claseId, name, emoji, color, order, xpReward },
    });
  } else {
    await prisma.tema.create({
      data: { claseId, name, emoji, color, order, xpReward },
    });
  }

  revalidatePath("/admin/clases");
  revalidatePath("/admin/temas");
  revalidatePath("/learn");
  return { success: id ? "Tema actualizado" : "Tema creado" };
}

export async function deleteTema(temaId: string) {
  await requireAdmin();

  await prisma.tema.delete({ where: { id: temaId } });

  revalidatePath("/admin/clases");
  revalidatePath("/admin/temas");
  revalidatePath("/admin/lessons");
  revalidatePath("/learn");
  return { success: "Tema eliminado. Sus lecciones quedaron sin tema." };
}

const defaultPositionFor = (index: number) => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const xs = row % 2 === 0 ? [20, 50, 80] : [80, 50, 20];
  return { posX: xs[col], posY: 10 + row * 24 };
};

export async function assignTema(temaId: string, claseId: string) {
  await requireAdmin();

  if (!claseId) return { error: "Selecciona una clase" };

  const clase = await prisma.clase.findUnique({ where: { id: claseId } });
  if (!clase) return { error: "La clase no existe" };

  const count = await prisma.tema.count({ where: { claseId } });
  await prisma.tema.update({
    where: { id: temaId },
    data: { claseId, ...defaultPositionFor(count) },
  });

  revalidatePath("/admin/clases");
  revalidatePath("/admin/temas");
  revalidatePath("/learn");
  return { success: "Tema asociado a la clase" };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export async function saveTemaPosition(temaId: string, posX: number, posY: number) {
  await requireAdmin();

  if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
    return { error: "Posición inválida" };
  }

  await prisma.tema.update({
    where: { id: temaId },
    data: { posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
  });

  revalidatePath("/learn");
  revalidatePath("/admin/temas");
  return { success: "Posición guardada" };
}

export async function unassignTema(temaId: string) {
  await requireAdmin();

  await prisma.tema.update({ where: { id: temaId }, data: { claseId: null } });

  revalidatePath("/admin/clases");
  revalidatePath("/admin/temas");
  revalidatePath("/learn");
  return { success: "Tema separado de la clase" };
}

type QuestionInput = {
  id?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  explanation?: string;
  timeSeconds?: number;
  options: { id?: string; text: string; imageUrl?: string; isCorrect: boolean }[];
};

function parseQuestions(raw: string): QuestionInput[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((q: Record<string, unknown>) => ({
      id: typeof q.id === "string" ? q.id : undefined,
      type: q.type === "TRUE_FALSE" ? "TRUE_FALSE" : "MULTIPLE_CHOICE",
      prompt: String(q.prompt ?? "").trim(),
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : undefined,
      timeSeconds:
        typeof q.timeSeconds === "number" && q.timeSeconds > 0
          ? Math.round(q.timeSeconds)
          : undefined,
      options: Array.isArray(q.options)
        ? q.options.map((o: Record<string, unknown>) => ({
            id: typeof o.id === "string" ? o.id : undefined,
            text: String(o.text ?? "").trim(),
            imageUrl:
              typeof o.imageUrl === "string" && o.imageUrl.trim()
                ? o.imageUrl.trim()
                : undefined,
            isCorrect: Boolean(o.isCorrect),
          }))
        : [],
    }));
  } catch {
    return null;
  }
}

export async function saveLesson(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const temaId = String(formData.get("temaId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "⚽").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const type = String(formData.get("type") || "LESSON") as
    | "LESSON"
    | "QUIZ"
    | "GAME";
  const gameMode = String(formData.get("gameMode") || "") as
    | ""
    | "ANAGRAM"
    | "INFOGRAMA";
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 10));
  const questions = parseQuestions(String(formData.get("questions") || "[]"));

  if (!["LESSON", "QUIZ", "GAME"].includes(type)) {
    return { error: "Tipo de lección inválido" };
  }
  if (!title) return { error: "Escribe el título" };
  if (title.length > 80) return { error: "El título es demasiado largo" };
  if (!questions || questions.length === 0) {
    return { error: "Agrega al menos una pregunta" };
  }
  if (questions.some((q) => !q.prompt)) {
    return { error: "Todas las preguntas necesitan enunciado" };
  }
  const needsOptions = gameMode !== "ANAGRAM";
  if (
    needsOptions &&
    questions.some(
      (q) =>
        (q.type === "MULTIPLE_CHOICE" && q.options.length < 2) ||
        (q.type === "TRUE_FALSE" && q.options.length < 2) ||
        !q.options.some((o) => o.isCorrect)
    )
  ) {
    return { error: "Cada pregunta necesita opciones y al menos una correcta" };
  }
  if (gameMode === "INFOGRAMA") {
    if (questions.some((q) => q.options.length !== 4)) {
      return { error: "En Infograma cada pregunta necesita exactamente 4 opciones (A, B, C, D)" };
    }
    if (questions.some((q) => q.options.some((o) => !o.text || !o.imageUrl))) {
      return { error: "En Infograma cada opción necesita un texto y una imagen" };
    }
  }

  const lessonData = {
    temaId,
    title,
    description: description || null,
    emoji,
    color,
    type,
    gameMode: gameMode || null,
    order,
    xpReward,
  };

  let lessonId = id;
  if (id) {
    await prisma.lesson.update({ where: { id }, data: lessonData });
  } else {
    const created = await prisma.lesson.create({ data: lessonData });
    lessonId = created.id;
  }

  if (!lessonId) return { error: "No se pudo guardar la lección" };

  const existingQuestions = await prisma.question.findMany({
    where: { lessonId },
    select: { id: true },
  });
  const keepIds = questions
    .map((q) => q.id)
    .filter((q): q is string => Boolean(q) && existingQuestions.some((e) => e.id === q));

  await prisma.question.deleteMany({
    where: { lessonId, id: { notIn: keepIds } },
  });

  for (const [qi, q] of questions.entries()) {
    if (q.id && keepIds.includes(q.id)) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation || null,
          timeSeconds: q.timeSeconds ?? null,
          order: qi,
        },
      });
      const existingOptions = await prisma.questionOption.findMany({
        where: { questionId: q.id },
        select: { id: true },
      });
      const keepOptionIds = q.options
        .map((o) => o.id)
        .filter((o): o is string => Boolean(o) && existingOptions.some((e) => e.id === o));
      await prisma.questionOption.deleteMany({
        where: { questionId: q.id, id: { notIn: keepOptionIds } },
      });
      for (const [oi, opt] of q.options.entries()) {
        if (opt.id && keepOptionIds.includes(opt.id)) {
          await prisma.questionOption.update({
            where: { id: opt.id },
            data: { text: opt.text, imageUrl: opt.imageUrl ?? null, isCorrect: opt.isCorrect, order: oi },
          });
        } else {
          await prisma.questionOption.create({
            data: {
              questionId: q.id,
              text: opt.text,
              imageUrl: opt.imageUrl ?? null,
              isCorrect: opt.isCorrect,
              order: oi,
            },
          });
        }
      }
    } else {
      await prisma.question.create({
        data: {
          lessonId,
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation || null,
          timeSeconds: q.timeSeconds ?? null,
          order: qi,
          options: {
            create: q.options.map((opt, oi) => ({
              text: opt.text,
              imageUrl: opt.imageUrl ?? null,
              isCorrect: opt.isCorrect,
              order: oi,
            })),
          },
        },
      });
    }
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/admin/juegos");
  revalidatePath("/admin/clases");
  revalidatePath("/learn");
  revalidatePath("/games");
  return { success: id ? "Lección actualizada" : "Lección creada" };
}

export async function deleteLesson(lessonId: string) {
  await requireAdmin();

  await prisma.lesson.delete({ where: { id: lessonId } });

  revalidatePath("/admin/lessons");
  revalidatePath("/admin/juegos");
  revalidatePath("/learn");
  revalidatePath("/games");
  return { success: "Lección eliminada" };
}

export async function deleteTeam(teamId: string) {
  await requireAdmin();

  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath("/admin/teams");
  return { success: "Equipo eliminado" };
}

export async function upsertIndicator(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string) || "DEPORTE";
  const indicatorId = formData.get("indicatorId") as string | null;

  if (!name) return { error: "Escribí el nombre del indicador" };

  const validCategory = ["DEPORTE", "NEUROCRACKS"].includes(category) ? category : "DEPORTE";

  if (indicatorId) {
    await prisma.indicator.update({
      where: { id: indicatorId },
      data: { name, category: validCategory as "DEPORTE" | "NEUROCRACKS" },
    });
  } else {
    await prisma.indicator.create({
      data: { name, category: validCategory as "DEPORTE" | "NEUROCRACKS", userId: null },
    });
  }

  revalidatePath("/admin/indicators");
  revalidatePath("/learn");
  return { success: indicatorId ? "Indicador actualizado" : "Indicador creado" };
}

export async function deleteIndicator(indicatorId: string) {
  await requireAdmin();
  await prisma.indicator.delete({ where: { id: indicatorId } });
  revalidatePath("/admin/indicators");
  revalidatePath("/learn");
  return { success: "Indicador eliminado" };
}
