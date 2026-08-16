"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLesson, deleteLesson } from "@/actions/admin";
import { PlusIcon, XIcon } from "@/components/icons";
import { useConfirmDialog } from "@/components/confirm-dialog";

const inputCls =
  "w-full rounded-xl border-2 border-green-100 bg-white/60 backdrop-blur-xl px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white";

const EMOJIS = [
  "⚽", "🏆", "🥅", "🥇", "🥈", "🥉",
  "🏅", "🎖️", "⭐", "🔥", "💪", "🧠",
  "📚", "📖", "✏️", "🎓", "📝", "💡",
  "👟", "🧤", "🟢", "🔴", "🔵", "🟡",
  "🟠", "🟣", "⚪", "🔺", "🔷", "🏃",
  "⏱️", "📈", "🗺️", "🎯", "✅", "🎲",
];

type OptionDraft = { id?: string; text: string; imageUrl?: string; isCorrect: boolean };
type QuestionDraft = {
  id?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  prompt: string;
  explanation: string;
  timeSeconds: number;
  options: OptionDraft[];
};

const newQuestion = (): QuestionDraft => ({
  type: "MULTIPLE_CHOICE",
  prompt: "",
  explanation: "",
  timeSeconds: 0,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

const emptyQuestion = (): QuestionDraft => ({
  type: "MULTIPLE_CHOICE",
  prompt: "",
  explanation: "",
  timeSeconds: 0,
  options: [],
});

const padOptionsTo4 = (opts: OptionDraft[]): OptionDraft[] => {
  const list = [...opts];
  while (list.length < 4) list.push({ text: "", isCorrect: false });
  const trimmed = list.slice(0, 4);
  return trimmed.some((o) => o.isCorrect)
    ? trimmed
    : trimmed.map((o, i) => ({ ...o, isCorrect: i === 0 }));
};

function OptionImage({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al subir la imagen");
        return;
      }
      onChange(data.url);
    } catch {
      setError("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Subir imagen"
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-green-200 bg-white text-zinc-400 transition hover:border-green-400 dark:border-emerald-800 dark:bg-emerald-900"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : uploading ? (
          <span className="animate-pulse text-[10px] font-black">...</span>
        ) : (
          <PlusIcon className="h-5 w-5" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Imagen de la opción (o súbela)"
        className={inputCls}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
          aria-label="Quitar imagen"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
    </div>
  );
}

export function LessonEditor({
  etapas,
  defaultValues,
  questions,
  mode = "lessons",
}: {
  etapas: {
    id: string;
    name: string;
    emoji: string;
    materias: { id: string; name: string }[];
  }[];
  mode?: "lessons" | "games";
  defaultValues?: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
    type: "LESSON" | "QUIZ" | "GAME" | "TRAINING";
    gameMode?:
      | "PENALTY"
      | "MEMORY"
      | "QUIZ"
      | "SPRINT"
      | "SETBACKS"
      | "ANAGRAM"
      | "INFOGRAMA"
      | null;
    order: number;
    xpReward: number;
    materiaId?: string | null;
  };
  questions?: {
    id: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    prompt: string;
    explanation: string | null;
    timeSeconds: number | null;
    options: { id: string; text: string; imageUrl?: string | null; isCorrect: boolean }[];
  }[];
}) {
  const [emoji, setEmoji] = useState(defaultValues?.emoji ?? "⚽");
  const [color, setColor] = useState(defaultValues?.color ?? "#16a34a");
  const [type, setType] = useState<"LESSON" | "QUIZ" | "GAME" | "TRAINING">(
    defaultValues?.type ?? (mode === "games" ? "GAME" : "LESSON")
  );
  const [gameMode, setGameMode] = useState<
    "PENALTY" | "MEMORY" | "QUIZ" | "SPRINT" | "SETBACKS" | "ANAGRAM" | "INFOGRAMA"
  >(defaultValues?.gameMode ?? (mode === "games" ? "INFOGRAMA" : "QUIZ"));
  const [materiaId, setMateriaId] = useState(defaultValues?.materiaId ?? "");
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [order, setOrder] = useState(defaultValues?.order ?? 0);
  const [xpReward, setXpReward] = useState(defaultValues?.xpReward ?? 10);
  const initialGameMode =
    defaultValues?.gameMode ?? (mode === "games" ? "INFOGRAMA" : "QUIZ");
  const initialNoOptions =
    mode === "games" && (initialGameMode === "ANAGRAM" || initialGameMode === "MEMORY");
  const [qs, setQs] = useState<QuestionDraft[]>(
    questions?.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      explanation: q.explanation ?? "",
      timeSeconds: q.timeSeconds ?? 0,
      options: initialNoOptions
        ? []
        : q.options.map((o) => ({
            id: o.id,
            text: o.text,
            imageUrl: o.imageUrl ?? undefined,
            isCorrect: o.isCorrect,
          })),
    })) ?? [initialNoOptions ? emptyQuestion() : newQuestion()]
  );
  const [state, formAction, pending] = useActionState(saveLesson, undefined);

  const isInfograma = mode === "games" && gameMode === "INFOGRAMA";
  const isWord = mode === "games" && gameMode === "ANAGRAM";
  const isMemory = mode === "games" && gameMode === "MEMORY";
  const noOptions = isWord || isMemory;

  const changeGameMode = (next: typeof gameMode) => {
    setGameMode(next);
    if (next === "ANAGRAM" || next === "MEMORY") {
      setQs((prev) => prev.map((q) => ({ ...q, options: [] })));
    } else if (next === "INFOGRAMA") {
      setQs((prev) => prev.map((q) => ({ ...q, options: padOptionsTo4(q.options) })));
    }
  };

  const updateQ = (qi: number, patch: Partial<QuestionDraft>) => {
    setQs((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  };
  const updateOpt = (qi: number, oi: number, patch: Partial<OptionDraft>) => {
    setQs((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : q
      )
    );
  };
  const setCorrect = (qi: number, oi: number) => {
    setQs((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) } : q
      )
    );
  };
  const addQ = () =>
    setQs((prev) => [...prev, noOptions ? emptyQuestion() : newQuestion()]);
  const removeQ = (qi: number) => setQs((prev) => prev.filter((_, i) => i !== qi));
  const addOpt = (qi: number) =>
    setQs((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q))
    );
  const removeOpt = (qi: number, oi: number) => {
    setQs((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q
      )
    );
  };

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="type" value={mode === "games" ? "GAME" : type} />
      <input type="hidden" name="gameMode" value={type === "GAME" ? gameMode : ""} />
      <input type="hidden" name="materiaId" value={materiaId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="xpReward" value={xpReward} />
      <input
        type="hidden"
        name="questions"
        value={JSON.stringify(
          qs.map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            explanation: q.explanation || undefined,
            timeSeconds: q.timeSeconds > 0 ? q.timeSeconds : undefined,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              imageUrl: o.imageUrl || undefined,
              isCorrect: o.isCorrect,
            })),
          }))
        )}
      />

      <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-5 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <h3 className="mb-4 font-black text-emerald-950 dark:text-white">
          {mode === "games" ? "Ficha del juego" : "Ficha de la lección"}
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-zinc-500">Icono</span>
              <select
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className={`${inputCls} text-lg`}
                style={{ width: "auto" }}
                aria-label="Icono"
              >
                {EMOJIS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (ej. Reglas del fútbol)"
              className={`${inputCls} flex-1`}
              required
            />
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional"
            className={inputCls}
          />
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              Tipo
              {mode === "games" ? (
                <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black text-white">
                  Juego
                </span>
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className={inputCls}
                  style={{ width: "auto" }}
                >
                  <option value="LESSON">Lección</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="GAME">Juego</option>
                  <option value="TRAINING">Entrenamiento</option>
                </select>
              )}
            </label>
            {(type === "GAME" || mode === "games") && (
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                Tipo de juego
                <select
                  value={gameMode}
                  onChange={(e) => changeGameMode(e.target.value as typeof gameMode)}
                  className={inputCls}
                  style={{ width: "auto" }}
                >
                  <option value="INFOGRAMA">Infograma (4 imágenes A-D)</option>
                  <option value="PENALTY">Tanda de Penales</option>
                  <option value="MEMORY">Memoria Táctica (parejas)</option>
                  <option value="QUIZ">Cuestionario</option>
                  <option value="SPRINT">Sprint Express</option>
                  <option value="SETBACKS">Contratiempos</option>
                  <option value="ANAGRAM">Palabra a Gol (palabras)</option>
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              Asignatura
              <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className={inputCls} style={{ width: "auto" }}>
                <option value="">Sin asignatura</option>
                {etapas.map((e) => (
                  <optgroup key={e.id} label={`${e.emoji} ${e.name}`}>
                    {e.materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              Orden
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className={`${inputCls} w-20`}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              XP
              <input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className={`${inputCls} w-20`}
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-lg border-2 border-green-100 bg-white dark:border-emerald-800"
            />
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className={`${inputCls} w-28 font-mono`} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-emerald-950 dark:text-white">
            Preguntas ({qs.length})
          </h3>
          <button
            type="button"
            onClick={addQ}
            className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-white transition hover:bg-green-600"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar pregunta
          </button>
        </div>

        {qs.map((q, qi) => (
          <div
            key={qi}
            className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-black text-white">
                {qi + 1}
              </span>
              {isInfograma ? (
                <span className="rounded-full bg-purple-500 px-2.5 py-1 text-[10px] font-black text-white">
                  Infograma · 4 opciones con imagen
                </span>
              ) : isWord ? (
                <span className="rounded-full bg-violet-500 px-2.5 py-1 text-[10px] font-black text-white">
                  Palabra a Gol · sin opciones
                </span>
              ) : isMemory ? (
                <span className="rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-black text-white">
                  Memoria Táctica · pareja
                </span>
              ) : (
                <select
                  value={q.type}
                  onChange={(e) => updateQ(qi, { type: e.target.value as QuestionDraft["type"] })}
                  className={`${inputCls} w-auto`}
                >
                  <option value="MULTIPLE_CHOICE">Opción múltiple</option>
                  <option value="TRUE_FALSE">Verdadero / Falso</option>
                </select>
              )}
              <div className="flex-1" />
              {qs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQ(qi)}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                  aria-label="Eliminar pregunta"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={q.prompt}
              onChange={(e) => updateQ(qi, { prompt: e.target.value })}
              placeholder={
                isWord
                  ? "Palabra (ej. FÚTBOL)"
                  : isMemory
                    ? "Emoji de la pareja (ej. ⚽)"
                    : "Enunciado de la pregunta"
              }
              className={inputCls}
            />
            <input
              type="text"
              value={q.explanation}
              onChange={(e) => updateQ(qi, { explanation: e.target.value })}
              placeholder={
                isWord
                  ? "Tema o pista (ej. Deporte de 11 jugadores)"
                  : isMemory
                    ? "Etiqueta (ej. Balón)"
                    : "Explicación (se muestra tras responder)"
              }
              className={`${inputCls} mt-2`}
            />
            {!noOptions && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">Tiempo (seg)</span>
                <input
                  type="number"
                  value={q.timeSeconds}
                  onChange={(e) => updateQ(qi, { timeSeconds: Math.max(0, Number(e.target.value)) })}
                  className={`${inputCls} w-20`}
                />
              </div>
            )}

            {!noOptions && (
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={opt.isCorrect}
                      onChange={() => setCorrect(qi, oi)}
                      className="h-4 w-4 accent-green-500"
                      title="Marcar como correcta"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOpt(qi, oi, { text: e.target.value })}
                      placeholder={`Opción ${oi + 1}`}
                      className={`${inputCls} ${opt.isCorrect ? "border-green-400 ring-1 ring-green-200" : ""}`}
                    />
                    {opt.isCorrect && (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700 dark:bg-green-950 dark:text-green-400">
                        Correcta
                      </span>
                    )}
                    {!isInfograma && q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOpt(qi, oi)}
                        className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                        aria-label="Eliminar opción"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!isInfograma && (
                  <button
                    type="button"
                    onClick={() => addOpt(qi)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-900"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Agregar opción
                  </button>
                )}
              </div>
            )}

            {isInfograma && (
              <div className="mt-3 space-y-2 border-t border-green-50 pt-3 dark:border-emerald-900">
                {q.options.map((opt, oi) => (
                  <OptionImage
                    key={oi}
                    value={opt.imageUrl ?? ""}
                    onChange={(url) => updateOpt(qi, oi, { imageUrl: url })}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500 dark:bg-red-950/30">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-600 dark:bg-green-950/30">
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-green-500 py-3.5 text-sm font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-50 dark:shadow-green-950"
      >
        {pending ? "Guardando…" : defaultValues
          ? mode === "games"
            ? "Guardar juego"
            : "Guardar cambios"
          : mode === "games"
            ? "Crear juego"
            : "Crear lección"}
      </button>
    </form>
  );
}

export function DeleteLessonButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { confirm, node } = useConfirmDialog();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm("¿Seguro que quieres eliminar esta lección? Se borrarán sus preguntas."))) return;
          startTransition(() => {
            void deleteLesson(id).then(() => router.refresh());
          });
        }}
        className="rounded-xl px-3 py-2 text-xs font-black text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
      >
        Eliminar
      </button>
      {node}
    </>
  );
}
