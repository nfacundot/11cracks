"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff, hasRole, PROTECTED_EMAILS, hashPassword } from "@/lib/auth";

export type AdminState = { error?: string; success?: string; userId?: string; userName?: string } | undefined;

const STAFF_BASES = ["/admin", "/superadmin"] as const;

function revalidateStaff(path: string) {
  for (const base of STAFF_BASES) {
    revalidatePath(`${base}${path}`);
  }
}

export type EditableLessonData = {
  defaultValues: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
    type: "LESSON" | "QUIZ" | "GAME" | "PREGUNTADOS" | "CONTRARRELOJ" | "SPEAKING" | "TYPING";
    gameMode?: "ANAGRAM" | "INFOGRAMA" | null;
    optionMode?: "TEXT" | "IMAGE" | "BOTH";
    timeSeconds?: number | null;
    order: number;
    xpReward: number;
    temaId?: string | null;
    language?: string | null;
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
  await requireStaff();

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
      optionMode: lesson.optionMode ?? "TEXT",
      timeSeconds: lesson.timeSeconds,
      order: lesson.order,
      xpReward: lesson.xpReward,
      temaId: lesson.temaId,
      language: lesson.language ?? "es",
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
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  ENTRENADOR: "Entrenador",
  JUGADOR: "Jugador",
} as const;

export async function setUserRole(
  userId: string,
  role: "SUPERADMIN" | "ADMIN" | "ENTRENADOR" | "JUGADOR"
) {
  const me = await requireStaff();

  if (!["SUPERADMIN", "ADMIN", "ENTRENADOR", "JUGADOR"].includes(role)) {
    return { error: "Rol inválido" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  const iAmSuperadmin = hasRole(me.role, "SUPERADMIN");
  const grantsStaffRole = role === "SUPERADMIN" || role === "ADMIN";
  const targetIsStaff = target.role === "SUPERADMIN" || target.role === "ADMIN";

  if (!iAmSuperadmin && (grantsStaffRole || targetIsStaff)) {
    return { error: "Solo un superadministrador puede gestionar cuentas del staff" };
  }
  if (PROTECTED_EMAILS.includes(target.email) && !iAmSuperadmin) {
    return { error: "Solo un superadministrador puede modificar la cuenta principal" };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidateStaff("/users");
  revalidateStaff("");
  revalidatePath("/coach");
  return { success: `Rol actualizado a ${ROLE_LABELS[role]}` };
}

export async function deleteUser(userId: string) {
  const me = await requireStaff();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (!target) return { error: "Usuario no encontrado" };
  if (PROTECTED_EMAILS.includes(target.email)) {
    return { error: "No puedes eliminar la cuenta principal del administrador" };
  }

  const targetIsStaff = target.role === "SUPERADMIN" || target.role === "ADMIN";
  if (targetIsStaff && !hasRole(me.role, "SUPERADMIN")) {
    return { error: "Solo un superadministrador puede eliminar cuentas del staff" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidateStaff("/users");
  revalidateStaff("");
  return { success: "Usuario eliminado" };
}

export async function createUser(prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireStaff();

  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "player");
  const position = String(formData.get("position") || "").trim() || null;
  const teamId = String(formData.get("teamId") || "").trim() || null;
  const shortName = String(formData.get("shortName") || "").trim();
  const number = String(formData.get("number") || "0");
  const category = String(formData.get("category") || "").trim();

  if (!displayName) return { error: "Escribe el nombre completo" };
  if (!email) return { error: "Escribe el correo electrónico" };
  if (!teamId) return { error: "Selecciona un equipo" };

  const dbRole = role === "coach" ? "ENTRENADOR" : "JUGADOR";

  const grantsStaffRole = false;
  if (grantsStaffRole && !hasRole(me.role, "SUPERADMIN")) {
    return { error: "Solo un superadministrador puede asignar rol de Administrador" };
  }

  const existsEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existsEmail) return { error: "Ya existe un usuario con ese correo" };

  let username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (!username) username = "user-" + Date.now();

  const baseUsername = username;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    username = `${baseUsername}${suffix}`;
    suffix++;
  }

  const password = `${displayName.split(" ")[0].toLowerCase()}${Date.now().toString(36)}`;
  const hashed = await hashPassword(password);

  const bioParts: string[] = [];
  if (shortName) bioParts.push(`Roster: ${shortName}`);
  if (number && number !== "0") bioParts.push(`#${number}`);
  if (category) bioParts.push(`Cat: ${category}`);

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email,
      username,
      password: hashed,
      role: dbRole as "JUGADOR" | "ENTRENADOR",
      position,
      bio: bioParts.length > 0 ? bioParts.join(" · ") : null,
    },
  });

  if (teamId) {
    await prisma.teamMember.create({
      data: { userId: user.id, teamId },
    });
  }

  revalidateStaff("/users");
  revalidateStaff("");
  return { success: `Usuario creado. Contraseña temporal: ${password}`, userId: user.id, userName: user.name };
}

export async function saveClase(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireStaff();

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

  revalidateStaff("/etapas");
  revalidateStaff("/caminos");
  revalidateStaff("");
  revalidatePath("/jugador/learn");
  return { success: id ? "Clase actualizada" : "Clase creada" };
}

export async function deleteClase(claseId: string) {
  await requireStaff();

  await prisma.clase.delete({ where: { id: claseId } });

  revalidateStaff("/etapas");
  revalidateStaff("");
  revalidatePath("/jugador/learn");
  return { success: "Clase eliminada" };
}

export async function saveTema(prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const etapaIds = formData
    .getAll("clases")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const name = String(formData.get("name") || "").trim();
  const emoji = String(formData.get("emoji") || "⭐").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 0));

  if (!name) return { error: "Escribe el nombre del tema" };

  let temaId = id;
  if (temaId) {
    await prisma.tema.update({
      where: { id: temaId },
      data: {
        name,
        emoji,
        color,
        order,
        xpReward,
        clases: { set: etapaIds.map((claseId) => ({ id: claseId })) },
      },
    });
  } else {
    const created = await prisma.tema.create({
      data: {
        name,
        emoji,
        color,
        order,
        xpReward,
        clases: { connect: etapaIds.map((claseId) => ({ id: claseId })) },
      },
    });
    temaId = created.id;
  }

  const tema = await prisma.tema.findUnique({
    where: { id: temaId },
    select: { posX: true, posY: true },
  });
  if (tema) {
    await prisma.etapaTema.deleteMany({
      where: { temaId, claseId: { notIn: etapaIds } },
    });
    await prisma.etapaLesson.deleteMany({
      where: { claseId: { notIn: etapaIds }, lesson: { temaId } },
    });
    for (const claseId of etapaIds) {
      await prisma.etapaTema.upsert({
        where: { claseId_temaId: { claseId, temaId } },
        update: {},
        create: { claseId, temaId, posX: tema.posX, posY: tema.posY },
      });
    }
  }

  revalidateStaff("/etapas");
  revalidateStaff("/caminos");
  revalidatePath("/jugador/learn");
  return { success: id ? "Tema actualizado" : "Tema creado" };
}

export async function deleteTema(temaId: string) {
  await requireStaff();

  await prisma.tema.delete({ where: { id: temaId } });

  revalidateStaff("/etapas");
  revalidateStaff("/caminos");
  revalidateStaff("/lessons");
  revalidatePath("/jugador/learn");
  return { success: "Tema eliminado. Sus lecciones quedaron sin tema." };
}

const defaultPositionFor = (index: number) => {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const xs = row % 2 === 0 ? [20, 50, 80] : [80, 50, 20];
  return { posX: xs[col], posY: 10 + row * 24 };
};

export async function assignTema(temaId: string, claseId: string) {
  await requireStaff();

  if (!claseId) return { error: "Selecciona una clase" };

  const clase = await prisma.clase.findUnique({ where: { id: claseId } });
  if (!clase) return { error: "La clase no existe" };

  const tema = await prisma.tema.findUnique({ where: { id: temaId } });
  if (!tema) return { error: "El tema no existe" };

  const position: { posX?: number; posY?: number } =
    tema.posX === 50 && tema.posY === 50
      ? defaultPositionFor((await prisma.tema.count({ where: { clases: { some: { id: claseId } } } })))
      : {};

  await prisma.tema.update({
    where: { id: temaId },
    data: { clases: { connect: { id: claseId } }, ...position },
  });

  await prisma.etapaTema.upsert({
    where: { claseId_temaId: { claseId, temaId } },
    update: {},
    create: {
      claseId,
      temaId,
      posX: position.posX ?? tema.posX,
      posY: position.posY ?? tema.posY,
    },
  });

  revalidateStaff("/etapas");
  revalidateStaff("/caminos");
  revalidatePath("/jugador/learn");
  return { success: "Tema asociado a la clase" };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export async function saveTemaPosition(temaId: string, posX: number, posY: number, claseId: string) {
  await requireStaff();

  if (!Number.isFinite(posX) || !Number.isFinite(posY) || !claseId) {
    return { error: "Posición inválida" };
  }

  await prisma.etapaTema.upsert({
    where: { claseId_temaId: { claseId, temaId } },
    update: { posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
    create: { claseId, temaId, posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
  });

  revalidatePath("/jugador/learn");
  revalidatePath("/jugador/neurocracks");
  revalidatePath("/coach/camino");
  revalidateStaff("/caminos");
  return { success: "Posición guardada" };
}

export async function saveLeccionPosition(lessonId: string, posX: number, posY: number, claseId: string) {
  await requireStaff();

  if (!Number.isFinite(posX) || !Number.isFinite(posY) || !claseId) {
    return { error: "Posición inválida" };
  }

  await prisma.etapaLesson.upsert({
    where: { claseId_lessonId: { claseId, lessonId } },
    update: { posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
    create: { claseId, lessonId, posX: clamp(posX, 3, 97), posY: clamp(posY, 3, 97) },
  });

  revalidatePath("/jugador/learn");
  revalidatePath("/jugador/neurocracks");
  revalidatePath("/coach/camino");
  revalidateStaff("/caminos");
  return { success: "Posición guardada" };
}

export async function unassignTema(temaId: string, claseId: string) {
  await requireStaff();

  if (!claseId) return { error: "Falta la clase" };

  await prisma.tema.update({
    where: { id: temaId },
    data: { clases: { disconnect: { id: claseId } } },
  });

  await prisma.etapaTema.deleteMany({ where: { claseId, temaId } });
  await prisma.etapaLesson.deleteMany({
    where: { claseId, lesson: { temaId } },
  });

  revalidateStaff("/etapas");
  revalidateStaff("/caminos");
  revalidatePath("/jugador/learn");
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
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const temaId = String(formData.get("temaId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "⚽").trim().slice(0, 4);
  const color = String(formData.get("color") || "#16a34a").trim();
  const type = String(formData.get("type") || "LESSON") as
    | "LESSON"
    | "QUIZ"
    | "GAME"
    | "PREGUNTADOS"
    | "CONTRARRELOJ"
    | "SPEAKING"
    | "TYPING";
  const gameMode = String(formData.get("gameMode") || "") as
    | ""
    | "ANAGRAM"
    | "INFOGRAMA";
  const optionMode = String(formData.get("optionMode") || "TEXT") as
    | "TEXT"
    | "IMAGE"
    | "BOTH";
  const timeSecondsRaw = String(formData.get("timeSeconds") || "");
  const timeSeconds =
    timeSecondsRaw && Number(timeSecondsRaw) > 0
      ? Math.max(1, Math.round(Number(timeSecondsRaw)))
      : null;
  const order = Math.max(0, Math.round(Number(formData.get("order")) || 0));
  const xpReward = Math.max(0, Math.round(Number(formData.get("xpReward")) || 10));
  const questions = parseQuestions(String(formData.get("questions") || "[]"));

  if (!["LESSON", "QUIZ", "GAME", "PREGUNTADOS", "CONTRARRELOJ", "SPEAKING", "TYPING"].includes(type)) {
    return { error: "Tipo de lección inválido" };
  }
  if (!["TEXT", "IMAGE", "BOTH"].includes(optionMode)) {
    return { error: "Modo de opciones inválido" };
  }
  if (type === "CONTRARRELOJ" && !timeSeconds) {
    return { error: "En Contrarreloj indica los segundos por pregunta" };
  }
  if (!title) return { error: "Escribe el título" };
  if (title.length > 80) return { error: "El título es demasiado largo" };
  if (!questions || questions.length === 0) {
    return { error: "Agrega al menos una pregunta" };
  }
  if (questions.some((q) => !q.prompt)) {
    return { error: "Todas las preguntas necesitan enunciado" };
  }
  const isQuestionsGame = type === "PREGUNTADOS" || type === "CONTRARRELOJ";
  const needsOptions = isQuestionsGame || (gameMode !== "ANAGRAM" && type !== "SPEAKING" && type !== "TYPING");
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
  if (isQuestionsGame) {
    const barePrompt = questions.some((q) => q.type !== "MULTIPLE_CHOICE");
    if (barePrompt) {
      return { error: "En estas lecciones las preguntas deben ser de opción múltiple" };
    }
    if (questions.some((q) => q.options.length < 2 || q.options.length > 4)) {
      return { error: "Cada pregunta necesita entre 2 y 4 opciones (A, B, C, D)" };
    }
    if (
      optionMode !== "TEXT" &&
      questions.some((q) => q.options.some((o) => !o.text.trim() && !o.imageUrl))
    ) {
      return { error: "Cada opción necesita texto o imagen (o ambas)" };
    }
    if (optionMode === "TEXT" && questions.some((q) => q.options.some((o) => !o.text.trim()))) {
      return { error: "Con opciones solo texto, cada opción necesita su texto" };
    }
    if (optionMode === "TEXT" && questions.some((q) => q.options.some((o) => o.imageUrl))) {
      return { error: "Con opciones solo texto no se permiten imágenes en las opciones" };
    }
  }
  if (gameMode === "INFOGRAMA") {
    if (questions.some((q) => q.options.length !== 4)) {
      return { error: "En Infograma cada pregunta necesita exactamente 4 opciones (A, B, C, D)" };
    }
    if (questions.some((q) => q.options.some((o) => !o.text || !o.imageUrl))) {
      return { error: "En Infograma cada opción necesita un texto y una imagen" };
    }
  }

  const languageRaw = String(formData.get("language") || "es").toLowerCase();
  const language = ["es", "en", "pt"].includes(languageRaw) ? languageRaw : "es";

  const lessonData = {
    temaId,
    title,
    description: description || null,
    emoji,
    color,
    type,
    gameMode: gameMode || null,
    optionMode: isQuestionsGame ? optionMode : "TEXT",
    timeSeconds: isQuestionsGame ? timeSeconds : null,
    order,
    xpReward,
    language,
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

  revalidateStaff("/lessons");
  revalidateStaff("/juegos");
  revalidateStaff("/etapas");
  revalidatePath("/admin/settings/lecciones");
  revalidatePath("/jugador/learn");
  revalidatePath("/jugador/games");
  return { success: id ? "Lección actualizada" : "Lección creada" };
}

export async function deleteLesson(lessonId: string) {
  await requireStaff();

  await prisma.lesson.delete({ where: { id: lessonId } });

  revalidateStaff("/lessons");
  revalidateStaff("/juegos");
  revalidatePath("/jugador/learn");
  revalidatePath("/jugador/games");
  return { success: "Lección eliminada" };
}

export async function addLessonsToTema(temaId: string, lessonIds: string[]) {
  await requireStaff();

  if (!temaId) return { error: "Falta la materia" };
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return { error: "Selecciona al menos una lección" };
  }

  const tema = await prisma.tema.findUnique({ where: { id: temaId } });
  if (!tema) return { error: "La materia no existe" };

  const taken = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, temaId: { not: null } },
    select: { title: true },
  });
  if (taken.length > 0) {
    return { error: `Ya están en otra materia: ${taken.map((l) => l.title).join(", ")}` };
  }

  await prisma.lesson.updateMany({
    where: { id: { in: lessonIds }, temaId: null },
    data: { temaId },
  });

  revalidateStaff("/settings/materias");
  revalidateStaff("/asignaturas");
  revalidateStaff("/lessons");
  revalidatePath("/jugador/learn");
  return {
    success:
      lessonIds.length === 1
        ? "Lección agregada a la materia"
        : `${lessonIds.length} lecciones agregadas a la materia`,
  };
}

export async function removeLessonsFromTema(temaId: string, lessonIds: string[]) {
  await requireStaff();

  if (!temaId) return { error: "Falta la materia" };
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return { error: "Selecciona al menos una lección" };
  }

  await prisma.lesson.updateMany({
    where: { id: { in: lessonIds }, temaId },
    data: { temaId: null },
  });

  revalidateStaff("/settings/materias");
  revalidateStaff("/asignaturas");
  revalidateStaff("/lessons");
  revalidatePath("/jugador/learn");
  return { success: "Lección retirada de la materia" };
}

export async function deleteTeam(teamId: string) {
  await requireStaff();

  await prisma.team.delete({ where: { id: teamId } });

  revalidateStaff("/teams");
  return { success: "Equipo eliminado" };
}

export async function updateTeam(input: {
  id: string;
  name: string;
  code: string;
  description: string;
}) {
  await requireStaff();

  const name = input.name.trim();
  const code = input.code.trim();
  const description = input.description.trim();

  if (!name) return { error: "Escribe el nombre del club" };
  if (name.length > 80) return { error: "El nombre del club es demasiado largo" };
  if (!code) return { error: "Escribe la clave del club" };

  await prisma.team.update({
    where: { id: input.id },
    data: { name, code, description: description || null },
  });

  revalidateStaff("/clubs");
  revalidateStaff("/teams");
  return { success: "Club actualizado" };
}

export async function upsertIndicator(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requireStaff();

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

  revalidateStaff("/indicators");
  revalidatePath("/jugador/learn");
  return { success: indicatorId ? "Indicador actualizado" : "Indicador creado" };
}

export async function deleteIndicator(indicatorId: string) {
  await requireStaff();
  await prisma.indicator.delete({ where: { id: indicatorId } });
  revalidateStaff("/indicators");
  revalidatePath("/jugador/learn");
  return { success: "Indicador eliminado" };
}

export async function upsertCharacteristic(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requireStaff();

  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string)?.trim() || null;
  const characteristicId = formData.get("characteristicId") as string | null;

  if (!name) return { error: "Escribí el nombre de la característica" };

  if (characteristicId) {
    await prisma.characteristic.update({
      where: { id: characteristicId },
      data: { name, color },
    });
  } else {
    await prisma.characteristic.create({
      data: { name, color },
    });
  }

  revalidateStaff("/caracteristicas");
  revalidatePath("/jugador/progress");
  return { success: characteristicId ? "Característica actualizada" : "Característica creada" };
}

export async function deleteCharacteristic(characteristicId: string) {
  await requireStaff();
  await prisma.characteristic.delete({ where: { id: characteristicId } });
  revalidateStaff("/caracteristicas");
  revalidatePath("/jugador/progress");
  return { success: "Característica eliminada" };
}
