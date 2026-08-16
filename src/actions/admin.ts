"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type AdminState = { error?: string; success?: string } | undefined;

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

export async function saveEtapa(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "🗺️").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));

  if (!name) return { error: "Escribe el nombre de la etapa" };
  if (name.length > 60) return { error: "El nombre es demasiado largo" };

  if (id) {
    await prisma.etapa.update({
      where: { id },
      data: { name, description: description || null, emoji, color, order },
    });
  } else {
    await prisma.etapa.create({
      data: { name, description: description || null, emoji, color, order },
    });
  }

  revalidatePath("/admin/etapas");
  revalidatePath("/admin/caminos");
  revalidatePath("/admin");
  revalidatePath("/learn");
  return { success: id ? "Etapa actualizada" : "Etapa creada" };
}

export async function deleteEtapa(etapaId: string) {
  await requireAdmin();

  const materias = await prisma.materia.findMany({
    where: { etapaId },
    select: { id: true },
  });
  if (materias.length > 0) {
    await prisma.materia.updateMany({
      where: { etapaId },
      data: { etapaId: null },
    });
  }

  await prisma.etapa.delete({ where: { id: etapaId } });

  revalidatePath("/admin/etapas");
  revalidatePath("/admin");
  revalidatePath("/learn");
  return { success: "Etapa eliminada" };
}

export async function saveMateria(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  const etapaId = String(formData.get("etapaId") || "").trim() || null;
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "⭐").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 0));

  if (!name) return { error: "Escribe el nombre de la asignatura" };

  if (id) {
    await prisma.materia.update({
      where: { id },
      data: { etapaId, name, emoji, color, order, xpReward },
    });
  } else {
    await prisma.materia.create({
      data: { etapaId, name, emoji, color, order, xpReward },
    });
  }

  revalidatePath("/admin/etapas");
  revalidatePath("/admin/caminos");
  revalidatePath("/learn");
  return { success: id ? "Asignatura actualizada" : "Asignatura creada" };
}

export async function deleteMateria(materiaId: string) {
  await requireAdmin();

  await prisma.materia.delete({ where: { id: materiaId } });

  revalidatePath("/admin/etapas");
  revalidatePath("/admin/caminos");
  revalidatePath("/admin/lessons");
  revalidatePath("/learn");
  return { success: "Asignatura eliminada. Sus lecciones quedaron sin asignatura." };
}

const defaultPositionFor = (index: number) => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const xs = row % 2 === 0 ? [20, 50, 80] : [80, 50, 20];
  return { posX: xs[col], posY: 10 + row * 24 };
};

export async function assignMateria(materiaId: string, etapaId: string) {
  await requireAdmin();

  if (!etapaId) return { error: "Selecciona una etapa" };

  const etapa = await prisma.etapa.findUnique({ where: { id: etapaId } });
  if (!etapa) return { error: "La etapa no existe" };

  const count = await prisma.materia.count({ where: { etapaId } });
  await prisma.materia.update({
    where: { id: materiaId },
    data: { etapaId, ...defaultPositionFor(count) },
  });

  revalidatePath("/admin/etapas");
  revalidatePath("/admin/caminos");
  revalidatePath("/learn");
  return { success: "Asignatura asociada a la etapa" };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export async function saveMateriaPosition(materiaId: string, posX: number, posY: number) {
  await requireAdmin();

  if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
    return { error: "Posición inválida" };
  }

  await prisma.materia.update({
    where: { id: materiaId },
    data: { posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
  });

  revalidatePath("/learn");
  revalidatePath("/admin/caminos");
  return { success: "Posición guardada" };
}

export async function unassignMateria(materiaId: string) {
  await requireAdmin();

  await prisma.materia.update({ where: { id: materiaId }, data: { etapaId: null } });

  revalidatePath("/admin/etapas");
  revalidatePath("/admin/caminos");
  revalidatePath("/learn");
  return { success: "Asignatura separada de la etapa" };
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
  const materiaId = String(formData.get("materiaId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "⚽").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const type = String(formData.get("type") || "LESSON") as
    | "LESSON"
    | "QUIZ"
    | "GAME"
    | "TRAINING";
  const gameMode = String(formData.get("gameMode") || "") as
    | ""
    | "PENALTY"
    | "MEMORY"
    | "QUIZ"
    | "SPRINT"
    | "SETBACKS"
    | "ANAGRAM"
    | "INFOGRAMA";
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 10));
  const questions = parseQuestions(String(formData.get("questions") || "[]"));

  if (!["LESSON", "QUIZ", "GAME", "TRAINING"].includes(type)) {
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
  const needsOptions = gameMode !== "ANAGRAM" && gameMode !== "MEMORY";
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
    materiaId,
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
  revalidatePath("/admin/etapas");
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
