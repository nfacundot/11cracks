"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { createVideoAction, deleteVideoAction, updateVideoAction, saveVideoQuizAction } from "@/app/actions/videos";
import type { VideosAdminWorkspace, VideoQuizQuestionAdminView } from "@/lib/videos/service";
import { useConfirmDialog } from "@/components/confirm-dialog";

const CATEGORY_LABEL: Record<string, string> = {
  PARA_MI: "PARA MÍ",
  ENTRENAMIENTO: "ENTRENAMIENTO",
  NEUROCRACKS: "NEUROCRACKS",
};

const CATEGORY_COLOR: Record<string, string> = {
  PARA_MI: "#4A90B8",
  ENTRENAMIENTO: "#7FA65A",
  NEUROCRACKS: "#C89B32",
};

interface QuizDraftOption {
  text: string;
  isCorrect: boolean;
}

interface QuizDraftQuestion {
  prompt: string;
  options: QuizDraftOption[];
}

function QuizEditor({
  videoId,
  initial,
  onClose,
}: {
  videoId: string;
  initial: VideoQuizQuestionAdminView[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [draft, setDraft] = useState<QuizDraftQuestion[]>(() =>
    initial.map((q) => ({ prompt: q.prompt, options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) }))
  );

  function setPrompt(index: number, prompt: string) {
    setDraft((prev) => prev.map((q, i) => (i === index ? { ...q, prompt } : q)));
  }
  function setOptionText(qIndex: number, oIndex: number, text: string) {
    setDraft((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, k) => (k === oIndex ? { ...o, text } : o)) } : q
      )
    );
  }
  function toggleCorrect(qIndex: number, oIndex: number) {
    setDraft((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, k) => ({ ...o, isCorrect: k === oIndex })) } : q
      )
    );
  }
  function addQuestion() {
    setDraft((prev) => [...prev, { prompt: "", options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }]);
  }
  function removeQuestion(index: number) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }
  function addOption(qIndex: number) {
    setDraft((prev) => prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q)));
  }
  function removeOption(qIndex: number, oIndex: number) {
    setDraft((prev) => prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, k) => k !== oIndex) } : q)));
  }

  function save() {
    const formData = new FormData();
    formData.set("videoId", videoId);
    formData.set("questions", JSON.stringify(draft));
    startTransition(async () => {
      try {
        const result = await saveVideoQuizAction(formData);
        setStatus({
          kind: "ok",
          text: result.count > 0 ? `Cuestionario guardado (${result.count} pregunta${result.count === 1 ? "" : "s"}).` : "Cuestionario eliminado.",
        });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof Error ? error.message : "No se pudo guardar el cuestionario." });
      }
    });
  }

  return (
    <div className="mt-3 rounded border p-3" style={{ borderColor: "#3A3A30", background: "#22221C" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "#C89B32" }}>
          Cuestionario del video
        </span>
        <button
          type="button"
          onClick={addQuestion}
          className="rounded border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ borderColor: "#C89B32", color: "#C89B32" }}
        >
          + Pregunta
        </button>
      </div>

      {status ? (
        <p className="mt-2 text-[12px]" style={{ color: status.kind === "ok" ? "#3E9E5C" : "#D2694A" }}>
          {status.text}
        </p>
      ) : null}

      {draft.length === 0 ? (
        <p className="mt-2 text-[12px]" style={{ color: S.textSecondary }}>
          Sin preguntas. El jugador termina el video y se marca como completado directamente.
        </p>
      ) : null}

      <div className="mt-3 grid gap-3">
        {draft.map((question, qi) => (
          <div key={qi} className="rounded border p-3" style={{ borderColor: "#3A3A30", background: "#1A1A15" }}>
            <div className="flex items-start justify-between gap-2">
              <input
                value={question.prompt}
                onChange={(e) => setPrompt(qi, e.target.value)}
                placeholder={`Pregunta ${qi + 1}`}
                className="w-full rounded border px-3 py-2 text-[13px] outline-none"
                style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
              />
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="rounded border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: "#D2694A", color: "#D2694A" }}
              >
                Quitar
              </button>
            </div>
            <div className="mt-2 grid gap-2">
              {question.options.map((option, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`videoQuiz-${qi}`}
                    checked={option.isCorrect}
                    onChange={() => toggleCorrect(qi, oi)}
                    style={{ accentColor: "#C89B32" }}
                  />
                  <input
                    value={option.text}
                    onChange={(e) => setOptionText(qi, oi, e.target.value)}
                    placeholder={`Opción ${oi + 1}`}
                    className="w-full rounded border px-3 py-2 text-[13px] outline-none"
                    style={{ borderColor: option.isCorrect ? "#C89B32" : "#3A3A30", background: "#22221C", color: S.textPrimary }}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(qi, oi)}
                    disabled={question.options.length <= 2}
                    className="rounded border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-30"
                    style={{ borderColor: "#3A3A30", color: S.textSecondary }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addOption(qi)}
              className="mt-2 rounded border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: "#3A3A30", color: "#4A90B8" }}
            >
              + Opción
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-40"
          style={{ background: "#C89B32", color: "#12120E" }}
        >
          {isPending ? "Guardando…" : "Guardar cuestionario"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ borderColor: "#3A3A30", color: S.textSecondary }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function VideosWorkspace({ view }: { view: VideosAdminWorkspace }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [category, setCategory] = useState<string>("PARA_MI");
  const [sourceType, setSourceType] = useState<"URL" | "FILE">("URL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quizEditorId, setQuizEditorId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("PARA_MI");
  const [editSourceType, setEditSourceType] = useState<"URL" | "FILE">("URL");
  const [editUrl, setEditUrl] = useState("");
  const [editFilePath, setEditFilePath] = useState("");

  const videos = view.videos;

  function startEdit(video: (typeof videos)[number]) {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description ?? "");
    setEditCategory(video.category);
    setEditSourceType(video.sourceType);
    setEditUrl(video.sourceType === "URL" ? (video.url ?? "") : "");
    setEditFilePath(video.sourceType === "FILE" ? (video.url ?? "") : "");
  }

  function saveEdit(videoId: string) {
    const formData = new FormData();
    formData.set("videoId", videoId);
    formData.set("title", editTitle);
    formData.set("description", editDescription);
    formData.set("category", editCategory);
    formData.set("sourceType", editSourceType);
    formData.set("url", editUrl);
    formData.set("filePath", editFilePath);
    startTransition(async () => {
      try {
        await updateVideoAction(formData);
        notify("ok", "Video actualizado.");
        setEditingId(null);
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "No se pudo actualizar el video.");
      }
    });
  }

  function notify(kind: "ok" | "error", text: string) {
    setMessage({ kind, text });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Error al subir el archivo.");
      setFileUrl(json.url);
      notify("ok", "Archivo subido. Completa el registro y guarda el video.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("category", category);
    formData.set("sourceType", sourceType);
    formData.set("url", sourceType === "URL" ? url : "");
    formData.set("filePath", sourceType === "FILE" ? fileUrl : "");
    startTransition(async () => {
      try {
        await createVideoAction(formData);
        notify("ok", `Video "${title}" registrado.`);
        setTitle("");
        setDescription("");
        setUrl("");
        setFileUrl("");
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "No se pudo registrar el video.");
      }
    });
  }

  async function remove(videoId: string, title: string) {
    const confirmed = await confirm(`¿Seguro que quieres eliminar el video "${title}"? Se borrará el registro y el avance de los jugadores.`, {
      title: "Eliminar video",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    const formData = new FormData();
    formData.set("videoId", videoId);
    startTransition(async () => {
      try {
        await deleteVideoAction(formData);
        notify("ok", "Video eliminado.");
        router.refresh();
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "No se pudo eliminar el video.");
      }
    });
  }

  return (
    <section style={{ paddingBottom: 64 }}>
      <GlobalHero
        eyebrow="ADMIN · VIDEOS"
        title="Videos"
        subtitle="Registra videos por URL o archivo; el jugador los ve y marca su avance en cada categoría."
      />

      {message ? (
        <div
          className="mt-4 border px-4 py-3 text-[13px]"
          style={{
            borderColor: message.kind === "ok" ? "#3E9E5C" : "#D2694A",
            color: message.kind === "ok" ? "#3E9E5C" : "#D2694A",
          }}
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border p-5" style={{ borderColor: "#2A2A24", background: "#1A1A15" }}>
        <h3 className="text-[16px] font-bold uppercase" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Nuevo video
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              Nombre *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-[14px] outline-none"
              style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              Descripción
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-[14px] outline-none"
              style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-[14px] outline-none"
              style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
            >
              <option value="PARA_MI">PARA MÍ</option>
              <option value="ENTRENAMIENTO">ENTRENAMIENTO</option>
              <option value="NEUROCRACKS">NEUROCRACKS</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              Fuente
            </label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setSourceType("URL")}
                className="flex-1 rounded border px-3 py-2 text-[13px] font-bold uppercase"
                style={{
                  borderColor: sourceType === "URL" ? "#C89B32" : "#3A3A30",
                  background: sourceType === "URL" ? "#3A3420" : "#22221C",
                  color: S.textPrimary,
                }}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setSourceType("FILE")}
                className="flex-1 rounded border px-3 py-2 text-[13px] font-bold uppercase"
                style={{
                  borderColor: sourceType === "FILE" ? "#C89B32" : "#3A3A30",
                  background: sourceType === "FILE" ? "#3A3420" : "#22221C",
                  color: S.textPrimary,
                }}
              >
                Archivo
              </button>
            </div>
          </div>
        </div>

        {sourceType === "URL" ? (
          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              URL del video *
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded border px-3 py-2 text-[14px] outline-none"
              style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
            />
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
              Archivo de video *
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="mt-1 w-full rounded border px-3 py-2 text-[14px]"
              style={{ borderColor: "#3A3A30", background: "#22221C", color: S.textPrimary }}
            />
            {uploading ? (
              <span className="mt-2 block text-[12px]" style={{ color: S.textSecondary }}>
                Subiendo archivo…
              </span>
            ) : fileUrl ? (
              <span className="mt-2 block text-[12px]" style={{ color: "#3E9E5C" }}>
                Listo: {fileUrl}
              </span>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={isPending || (sourceType === "FILE" && !fileUrl) || !title.trim()}
          className="mt-4 rounded px-5 py-2 text-[13px] font-bold uppercase tracking-[0.14em] disabled:opacity-40"
          style={{ background: "#C89B32", color: "#12120E" }}
        >
          {isPending ? "Guardando…" : "Registrar video"}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-[16px] font-bold uppercase" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Videos registrados · {videos.length}
        </h3>

        {videos.length === 0 ? (
          <p className="mt-3 text-[13px]" style={{ color: S.textSecondary }}>
            Aún no hay videos registrados.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {videos.map((video) => (
              <article
                key={video.id}
                className="rounded-lg border p-4"
                style={{ borderColor: "#2A2A24", background: "#1A1A15" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ background: CATEGORY_COLOR[video.category] ?? "#4A90B8", color: "#12120E" }}
                  >
                    {CATEGORY_LABEL[video.category] ?? video.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                    {video.sourceType === "URL" ? "URL" : "ARCHIVO"}
                  </span>
                </div>
                <h4 className="mt-2 text-[16px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {video.title}
                </h4>
                {video.description ? (
                  <p className="mt-1 text-[12px]" style={{ color: S.textSecondary }}>
                    {video.description}
                  </p>
                ) : null}
                <a
                  href={video.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-[11px]"
                  style={{ color: "#4A90B8" }}
                >
                  {video.url}
                </a>
                {editingId === video.id ? (
                  <div
                    className="mt-3 rounded border p-3"
                    style={{ borderColor: "#3A3A30", background: "#22221C" }}
                  >
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                        Nombre *
                      </label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-[13px] outline-none"
                        style={{ borderColor: "#3A3A30", background: "#1A1A15", color: S.textPrimary }}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                        Descripción
                      </label>
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-[13px] outline-none"
                        style={{ borderColor: "#3A3A30", background: "#1A1A15", color: S.textPrimary }}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                        Categoría
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-[13px] outline-none"
                        style={{ borderColor: "#3A3A30", background: "#1A1A15", color: S.textPrimary }}
                      >
                        <option value="PARA_MI">PARA MÍ</option>
                        <option value="ENTRENAMIENTO">ENTRENAMIENTO</option>
                        <option value="NEUROCRACKS">NEUROCRACKS</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                        Fuente
                      </label>
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditSourceType("URL")}
                          className="flex-1 rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                          style={{
                            borderColor: editSourceType === "URL" ? "#C89B32" : "#3A3A30",
                            background: editSourceType === "URL" ? "#3A3420" : "#1A1A15",
                            color: S.textPrimary,
                          }}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSourceType("FILE")}
                          className="flex-1 rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                          style={{
                            borderColor: editSourceType === "FILE" ? "#C89B32" : "#3A3A30",
                            background: editSourceType === "FILE" ? "#3A3420" : "#1A1A15",
                            color: S.textPrimary,
                          }}
                        >
                          Archivo
                        </button>
                      </div>
                    </div>
                    {editSourceType === "URL" ? (
                      <div className="mt-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                          URL del video *
                        </label>
                        <input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://…"
                          className="mt-1 w-full rounded border px-3 py-2 text-[13px] outline-none"
                          style={{ borderColor: "#3A3A30", background: "#1A1A15", color: S.textPrimary }}
                        />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: S.textSecondary }}>
                          Archivo actual
                        </label>
                        <input
                          value={editFilePath}
                          onChange={(e) => setEditFilePath(e.target.value)}
                          className="mt-1 w-full rounded border px-3 py-2 text-[13px] outline-none"
                          style={{ borderColor: "#3A3A30", background: "#1A1A15", color: S.textPrimary }}
                        />
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(video.id)}
                        disabled={isPending}
                        className="rounded px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-40"
                        style={{ background: "#7FA65A", color: "#12120E" }}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ borderColor: "#3A3A30", color: S.textSecondary }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(video)}
                      className="rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ borderColor: "#4A90B8", color: "#4A90B8" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizEditorId((prev) => (prev === video.id ? null : video.id))}
                      className="rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        borderColor: quizEditorId === video.id ? "#C89B32" : "#3A3A30",
                        color: quizEditorId === video.id ? "#C89B32" : S.textSecondary,
                      }}
                    >
                      Cuestionario{video.quiz.length > 0 ? ` · ${video.quiz.length}` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(video.id, video.title)}
                      className="rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ borderColor: "#D2694A", color: "#D2694A" }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
                {quizEditorId === video.id ? (
                  <QuizEditor videoId={video.id} initial={video.quiz} onClose={() => setQuizEditorId(null)} />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      {node}
    </section>
  );
}