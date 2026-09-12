"use server";
import { requireSection, requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createVideo, deleteVideo, markVideoCompleted, updateVideo, saveVideoQuiz, completeVideoQuiz } from "@/lib/videos/service";
import type { VideoCategory, VideoSourceType, VideoAdminView } from "@/lib/videos/service";

function value(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : null;
}

export async function createVideoAction(formData: FormData): Promise<VideoAdminView> {
  const user = await requireSection("ADMIN");
  const title = value(formData, "title");
  if (!title) throw new Error("El nombre del video es obligatorio.");
  const description = value(formData, "description");
  const category = (value(formData, "category") ?? "") as VideoCategory;
  const sourceType = (value(formData, "sourceType") ?? "URL") as VideoSourceType;
  const url = value(formData, "url");
  const filePath = value(formData, "filePath");

  const created = await createVideo({
    title,
    description,
    category,
    sourceType,
    url,
    filePath,
    createdBy: user.id,
  });
  revalidatePath("/admin/videos");
  revalidatePath("/jugador/videos");
  return created;
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  await requireSection("ADMIN");
  const videoId = value(formData, "videoId");
  if (!videoId) throw new Error("No se indicó el video a eliminar.");
  await deleteVideo(videoId);
  revalidatePath("/admin/videos");
  revalidatePath("/jugador/videos");
}

export async function updateVideoAction(formData: FormData): Promise<void> {
  await requireSection("ADMIN");
  const videoId = value(formData, "videoId");
  if (!videoId) throw new Error("No se indicó el video a editar.");
  const title = value(formData, "title");
  if (!title) throw new Error("El nombre del video es obligatorio.");
  const description = value(formData, "description");
  const category = (value(formData, "category") ?? "") as VideoCategory;
  const sourceType = (value(formData, "sourceType") ?? "URL") as VideoSourceType;
  const url = value(formData, "url");
  const filePath = value(formData, "filePath");
  await updateVideo({
    id: videoId,
    title,
    description,
    category,
    sourceType,
    url,
    filePath,
  });
  revalidatePath("/admin/videos");
  revalidatePath("/jugador/videos");
}

export async function markVideoCompletedAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const videoId = value(formData, "videoId");
  if (!videoId) throw new Error("No se indicó el video.");
  await markVideoCompleted({ actorId: user.id, playerId: user.id, videoId });
  revalidatePath("/jugador/videos");
}

export async function saveVideoQuizAction(formData: FormData): Promise<{ videoId: string; count: number }> {
  await requireSection("ADMIN");
  const videoId = value(formData, "videoId");
  if (!videoId) throw new Error("No se indicó el video.");
  const rawQuestions = formData.get("questions");
  let questions: { prompt: string; options: { text: string; isCorrect: boolean }[] }[] = [];
  if (typeof rawQuestions === "string" && rawQuestions.trim()) {
    try {
      const parsed = JSON.parse(rawQuestions) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Formato inválido.");
      questions = parsed.map((q) => {
        const question = q as { prompt?: unknown; options?: unknown };
        const options = Array.isArray(question.options)
          ? question.options.map((o) => {
              const option = o as { text?: unknown; isCorrect?: unknown };
              return {
                text: typeof option.text === "string" ? option.text : "",
                isCorrect: option.isCorrect === true,
              };
            })
          : [];
        return { prompt: typeof question.prompt === "string" ? question.prompt : "", options };
      });
    } catch {
      throw new Error("El cuestionario enviado no tiene un formato válido.");
    }
  }
  const result = await saveVideoQuiz({ videoId, questions });
  revalidatePath("/admin/videos");
  revalidatePath("/jugador/videos");
  return result;
}

export async function completeVideoQuizAction(formData: FormData): Promise<{ total: number; correct: number }> {
  const user = await requireUser();
  const videoId = value(formData, "videoId");
  if (!videoId) throw new Error("No se indicó el video.");
  const rawAnswers = formData.get("answers");
  let answers: { questionId: string; optionId: string }[] = [];
  if (typeof rawAnswers === "string" && rawAnswers.trim()) {
    try {
      const parsed = JSON.parse(rawAnswers) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Formato inválido.");
      answers = parsed.map((a) => {
        const answer = a as { questionId?: unknown; optionId?: unknown };
        return {
          questionId: typeof answer.questionId === "string" ? answer.questionId : "",
          optionId: typeof answer.optionId === "string" ? answer.optionId : "",
        };
      });
    } catch {
      throw new Error("Las respuestas enviadas no tienen un formato válido.");
    }
  }
  const result = await completeVideoQuiz({ actorId: user.id, playerId: user.id, videoId, answers });
  revalidatePath("/jugador/videos");
  return result;
}