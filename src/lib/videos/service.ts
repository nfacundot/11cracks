import "server-only";
import { prisma } from "@/lib/prisma";
import type { VideoCategory, VideoSourceType } from "@/generated/prisma/client";

export type { VideoCategory, VideoSourceType } from "@/generated/prisma/client";

export const VIDEO_CATEGORY_LABEL: Record<VideoCategory, string> = {
  PARA_MI: "PARA MÍ",
  ENTRENAMIENTO: "ENTRENAMIENTO",
  NEUROCRACKS: "NEUROCRACKS",
};

export interface VideoQuizOptionView {
  id: string;
  text: string;
}

export interface VideoQuizQuestionView {
  id: string;
  prompt: string;
  options: VideoQuizOptionView[];
}

export interface VideoQuizOptionAdminView extends VideoQuizOptionView {
  isCorrect: boolean;
}

export interface VideoQuizQuestionAdminView {
  id: string;
  prompt: string;
  options: VideoQuizOptionAdminView[];
}

export interface VideoAdminView {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  sourceType: VideoSourceType;
  url: string | null;
  createdAt: Date;
  quiz: VideoQuizQuestionAdminView[];
}

export interface VideosAdminWorkspace {
  videos: VideoAdminView[];
}

export async function getVideosAdminWorkspace(): Promise<VideosAdminWorkspace> {
  const videos = await prisma.video.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      sourceType: true,
      url: true,
      filePath: true,
      createdAt: true,
      questions: {
        orderBy: [{ order: "asc" }],
        select: {
          id: true,
          prompt: true,
          options: {
            orderBy: [{ order: "asc" }],
            select: { id: true, text: true, isCorrect: true },
          },
        },
      },
    },
  });

  return {
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      category: v.category,
      sourceType: v.sourceType,
      url: v.sourceType === "FILE" ? v.filePath : v.url,
      createdAt: v.createdAt,
      quiz: v.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      })),
    })),
  };
}

export interface CreateVideoParams {
  title: string;
  description?: string | null;
  category: VideoCategory;
  sourceType: VideoSourceType;
  url?: string | null;
  filePath?: string | null;
  createdBy: string;
}

const VALID_CATEGORIES: VideoCategory[] = ["PARA_MI", "ENTRENAMIENTO", "NEUROCRACKS"];
const VALID_SOURCE_TYPES: VideoSourceType[] = ["URL", "FILE"];

export async function createVideo(params: CreateVideoParams): Promise<VideoAdminView> {
  const title = params.title.trim();
  if (!title) throw new Error("El nombre del video es obligatorio.");
  if (!VALID_CATEGORIES.includes(params.category)) {
    throw new Error(`Categoría inválida: ${params.category}`);
  }
  if (!VALID_SOURCE_TYPES.includes(params.sourceType)) {
    throw new Error(`Tipo de fuente inválido: ${params.sourceType}`);
  }

  const url = params.sourceType === "URL" ? (params.url ?? "").trim() : null;
  const filePath = params.sourceType === "FILE" ? (params.filePath ?? "").trim() : null;
  if (params.sourceType === "URL" && !url) throw new Error("Para un video por URL se requiere la URL.");
  if (params.sourceType === "FILE" && !filePath) throw new Error("Para un video por archivo se requiere subir el archivo.");

  const description = (params.description ?? "").trim() || null;

  const created = await prisma.video.create({
    data: {
      title,
      description,
      category: params.category,
      sourceType: params.sourceType,
      url,
      filePath,
      createdBy: params.createdBy,
    },
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    category: created.category,
    sourceType: created.sourceType,
    url: created.sourceType === "FILE" ? created.filePath : created.url,
    createdAt: created.createdAt,
    quiz: [],
  };
}

export async function deleteVideo(videoId: string): Promise<void> {
  const existing = await prisma.video.findUnique({ where: { id: videoId } });
  if (!existing) throw new Error("Video no encontrado.");
  await prisma.video.delete({ where: { id: videoId } });
}

export interface UpdateVideoParams {
  id: string;
  title?: string;
  description?: string | null;
  category?: VideoCategory;
  sourceType?: VideoSourceType;
  url?: string | null;
  filePath?: string | null;
}

export async function updateVideo(params: UpdateVideoParams): Promise<VideoAdminView> {
  const existing = await prisma.video.findUnique({ where: { id: params.id } });
  if (!existing) throw new Error("Video no encontrado.");

  const title = (params.title ?? existing.title).trim();
  if (!title) throw new Error("El nombre del video es obligatorio.");
  if (params.category && !VALID_CATEGORIES.includes(params.category)) {
    throw new Error(`Categoría inválida: ${params.category}`);
  }
  const description =
    params.description === undefined ? existing.description : (params.description ?? "").trim() || null;

  const sourceType = params.sourceType ?? existing.sourceType;
  if (sourceType && !VALID_SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Tipo de fuente inválido: ${sourceType}`);
  }

  const url = sourceType === "URL" ? ((params.url ?? "").trim() || null) : null;
  const filePath = sourceType === "FILE" ? (params.filePath ?? existing.filePath) : existing.filePath;
  if (sourceType === "URL" && !url) throw new Error("Para un video por URL se requiere la URL.");
  if (sourceType === "FILE" && !filePath) throw new Error("Para un video por archivo se requiere el archivo.");

  const updated = await prisma.video.update({
    where: { id: params.id },
    data: {
      title,
      description,
      category: params.category ? params.category : existing.category,
      sourceType,
      url,
      filePath,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    category: updated.category,
    sourceType: updated.sourceType,
    url: updated.sourceType === "FILE" ? updated.filePath : updated.url,
    createdAt: updated.createdAt,
    quiz: [],
  };
}

export interface PlayerVideoView {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  url: string | null;
  completed: boolean;
  completedAt: Date | null;
  quiz: VideoQuizQuestionView[];
}

export async function getPlayerVideosWorkspace(playerId: string): Promise<PlayerVideoView[]> {
  const [videos, progresses] = await Promise.all([
    prisma.video.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        sourceType: true,
        url: true,
        filePath: true,
        questions: {
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            prompt: true,
            options: {
              orderBy: [{ order: "asc" }],
              select: { id: true, text: true },
            },
          },
        },
      },
    }),
    prisma.videoProgress.findMany({
      where: { playerId },
      select: { videoId: true, completedAt: true },
    }),
  ]);

  const byVideo = new Map(progresses.map((p) => [p.videoId, p.completedAt]));

  return videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    category: v.category,
    url: v.sourceType === "FILE" ? v.filePath : v.url,
    completed: byVideo.has(v.id),
    completedAt: byVideo.get(v.id) ?? null,
    quiz: v.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  }));
}

export async function markVideoCompleted(params: { actorId: string; playerId: string; videoId: string }): Promise<void> {
  if (params.actorId !== params.playerId) {
    throw new Error("Un jugador solo puede marcar completados sus propios videos.");
  }
  const video = await prisma.video.findUnique({ where: { id: params.videoId } });
  if (!video) throw new Error("Video no encontrado.");
  await prisma.videoProgress.upsert({
    where: { videoId_playerId: { videoId: params.videoId, playerId: params.playerId } },
    create: { videoId: params.videoId, playerId: params.playerId, completedAt: new Date() },
    update: {},
  });
}

export interface SaveVideoQuizQuestion {
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
}

export async function saveVideoQuiz(params: { videoId: string; questions: SaveVideoQuizQuestion[] }): Promise<{ videoId: string; count: number }> {
  const video = await prisma.video.findUnique({ where: { id: params.videoId } });
  if (!video) throw new Error("Video no encontrado.");

  const normalized = params.questions.map((q) => ({
    prompt: q.prompt.trim(),
    options: q.options
      .map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect }))
      .filter((o) => o.text.length > 0),
  }));

  for (const question of normalized) {
    if (!question.prompt) throw new Error("Cada pregunta necesita un enunciado.");
    if (question.options.length < 2) throw new Error(`La pregunta "${question.prompt}" necesita al menos 2 opciones.`);
    if (question.options.filter((o) => o.isCorrect).length !== 1) {
      throw new Error(`La pregunta "${question.prompt}" necesita exactamente 1 opción correcta.`);
    }
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { videoId: params.videoId } }),
    ...normalized.map((question, qi) =>
      prisma.question.create({
        data: {
          videoId: params.videoId,
          prompt: question.prompt,
          order: qi,
          type: "MULTIPLE_CHOICE",
          options: {
            create: question.options.map((option, oi) => ({
              text: option.text,
              isCorrect: option.isCorrect,
              order: oi,
            })),
          },
        },
      })
    ),
  ]);

  return { videoId: params.videoId, count: normalized.length };
}

export interface CompleteVideoQuizAnswer {
  questionId: string;
  optionId: string;
}

export interface CompleteVideoQuizResult {
  total: number;
  correct: number;
}

export async function completeVideoQuiz(params: {
  actorId: string;
  playerId: string;
  videoId: string;
  answers: CompleteVideoQuizAnswer[];
}): Promise<CompleteVideoQuizResult> {
  if (params.actorId !== params.playerId) {
    throw new Error("Un jugador solo puede completar sus propios videos.");
  }
  const video = await prisma.video.findUnique({
    where: { id: params.videoId },
    select: {
      id: true,
      questions: { select: { id: true, options: { select: { id: true, isCorrect: true } } }, orderBy: { order: "asc" } },
    },
  });
  if (!video) throw new Error("Video no encontrado.");
  if (video.questions.length === 0) {
    throw new Error("Este video no tiene cuestionario.");
  }

  const byQuestion = new Map(video.questions.map((q) => [q.id, q.options]));
  const answered = new Set(params.answers.map((a) => a.questionId));

  for (const question of video.questions) {
    if (!answered.has(question.id)) throw new Error("Debes responder todas las preguntas del cuestionario.");
  }

  const graded = params.answers.map((answer) => {
    const options = byQuestion.get(answer.questionId);
    if (!options) throw new Error("Respuesta inválida: pregunta desconocida.");
    const option = options.find((o) => o.id === answer.optionId);
    if (!option) throw new Error("Respuesta inválida: opción desconocida.");
    return { questionId: answer.questionId, optionId: answer.optionId, isCorrect: option.isCorrect };
  });

  await prisma.$transaction([
    prisma.answerRecord.deleteMany({
      where: { userId: params.playerId, questionId: { in: video.questions.map((q) => q.id) } },
    }),
    prisma.answerRecord.createMany({
      data: graded.map((g) => ({
        userId: params.playerId,
        questionId: g.questionId,
        optionId: g.optionId,
        isCorrect: g.isCorrect,
      })),
    }),
    prisma.videoProgress.upsert({
      where: { videoId_playerId: { videoId: params.videoId, playerId: params.playerId } },
      create: { videoId: params.videoId, playerId: params.playerId, completedAt: new Date() },
      update: {},
    }),
  ]);

  return { total: graded.length, correct: graded.filter((g) => g.isCorrect).length };
}