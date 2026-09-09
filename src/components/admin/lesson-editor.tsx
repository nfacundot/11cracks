"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLesson, deleteLesson } from "@/actions/admin";
import { PlusIcon, XIcon } from "@/components/icons";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { Modal } from "@/components/admin/modal";

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
        placeholder="Imagen de la opción (o súbelo)"
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

function EmojiField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const options = value && !EMOJIS.includes(value) ? [...EMOJIS, value] : EMOJIS;
  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} w-auto`}
        aria-label="Icono"
      >
        <option value="">Sin icono</option>
        {options.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function QuestionFields({
  value,
  onChange,
  isInfograma,
  isWord,
  noOptions,
  radioName,
  isQuizMode,
  showOptionImages,
}: {
  value: QuestionDraft;
  onChange: (patch: Partial<QuestionDraft>) => void;
  isInfograma: boolean;
  isWord: boolean;
  noOptions: boolean;
  radioName: string;
  isQuizMode: boolean;
  showOptionImages: boolean;
}) {
  const setCorrect = (oi: number) =>
    onChange({ options: value.options.map((o, j) => ({ ...o, isCorrect: j === oi })) });
  const updateOpt = (oi: number, patch: Partial<OptionDraft>) =>
    onChange({
      options: value.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
    });
  const addOpt = () => onChange({ options: [...value.options, { text: "", isCorrect: false }] });
  const removeOpt = (oi: number) =>
    onChange({ options: value.options.filter((_, j) => j !== oi) });

  return (
    <>
      {!isInfograma && !isWord && !isQuizMode && (
        <div className="mb-2">
          <select
            value={value.type}
            onChange={(e) => onChange({ type: e.target.value as QuestionDraft["type"] })}
            className={`${inputCls} w-auto`}
          >
            <option value="MULTIPLE_CHOICE">Opción múltiple</option>
            <option value="TRUE_FALSE">Verdadero / Falso</option>
          </select>
        </div>
      )}
      <input
        type="text"
        value={value.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder={isWord ? "Palabra (ej. FÚTBOL)" : "Enunciado de la pregunta"}
        className={inputCls}
      />
      {isWord ? (
        <EmojiField
          value={value.explanation}
          onChange={(v) => onChange({ explanation: v })}
          placeholder="o escribe tu propio tema"
        />
      ) : (
        <input
          type="text"
          value={value.explanation}
          onChange={(e) => onChange({ explanation: e.target.value })}
          placeholder="Explicación (se muestra tras responder)"
          className={`${inputCls} mt-2`}
        />
      )}
      {!noOptions && !isQuizMode && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">Tiempo (seg)</span>
          <input
            type="number"
            value={value.timeSeconds}
            onChange={(e) => onChange({ timeSeconds: Math.max(0, Number(e.target.value)) })}
            className={`${inputCls} w-20`}
          />
        </div>
      )}
      {!noOptions && (
        <div className="mt-3 space-y-2">
          {value.options.map((opt, oi) => (
            <div key={oi}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={radioName}
                  checked={opt.isCorrect}
                  onChange={() => setCorrect(oi)}
                  className="h-4 w-4 accent-green-500"
                  title="Marcar como correcta"
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOpt(oi, { text: e.target.value })}
                  placeholder={`Opción ${oi + 1}`}
                  className={`${inputCls} ${opt.isCorrect ? "border-green-400 ring-1 ring-green-200" : ""}`}
                />
                {opt.isCorrect && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700 dark:bg-green-950 dark:text-green-400">
                    Correcta
                  </span>
                )}
                {!isInfograma && value.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpt(oi)}
                    className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                    aria-label="Eliminar opción"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showOptionImages && (
                <OptionImage
                  value={opt.imageUrl ?? ""}
                  onChange={(url) => updateOpt(oi, { imageUrl: url })}
                />
              )}
            </div>
          ))}
          {!isInfograma && (
            <button
              type="button"
              onClick={addOpt}
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
          {value.options.map((opt, oi) => (
            <OptionImage
              key={oi}
              value={opt.imageUrl ?? ""}
              onChange={(url) => updateOpt(oi, { imageUrl: url })}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function LessonEditor({
  clases,
  defaultValues,
  questions,
  mode = "lessons",
  initialType = mode === "games" ? "GAME" : "LESSON",
  onSaved,
}: {
  clases: {
    id: string;
    name: string;
    emoji: string;
    temas: { id: string; name: string }[];
  }[];
  mode?: "lessons" | "games";
  initialType?: "LESSON" | "QUIZ" | "GAME" | "PREGUNTADOS" | "CONTRARRELOJ";
  onSaved?: () => void;
  defaultValues?: {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
    type: "LESSON" | "QUIZ" | "GAME" | "PREGUNTADOS" | "CONTRARRELOJ";
    gameMode?:
      | "ANAGRAM"
      | "INFOGRAMA"
      | null;
    optionMode?: "TEXT" | "IMAGE" | "BOTH";
    timeSeconds?: number | null;
    order: number;
    xpReward: number;
    temaId?: string | null;
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
  const [type, setType] = useState<"LESSON" | "QUIZ" | "GAME" | "PREGUNTADOS" | "CONTRARRELOJ">(
    defaultValues?.type ?? initialType
  );
  const [optionMode, setOptionMode] = useState<"TEXT" | "IMAGE" | "BOTH">(
    defaultValues?.optionMode ?? "TEXT"
  );
  const [seconds, setSeconds] = useState(
    defaultValues?.timeSeconds ?? 10
  );
  const [gameMode, setGameMode] = useState<
    "ANAGRAM" | "INFOGRAMA"
  >(defaultValues?.gameMode ?? (mode === "games" ? "INFOGRAMA" : "ANAGRAM"));
  const [temaId, setTemaId] = useState(defaultValues?.temaId ?? "");
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [order, setOrder] = useState(defaultValues?.order ?? 0);
  const [xpReward, setXpReward] = useState(defaultValues?.xpReward ?? 10);
  const initialGameMode =
    defaultValues?.gameMode ?? (mode === "games" ? "INFOGRAMA" : "ANAGRAM");
  const initialNoOptions =
    mode === "games" && initialGameMode === "ANAGRAM";
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

  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state?.success && !prevSuccessRef.current) onSaved?.();
    prevSuccessRef.current = Boolean(state?.success);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const isInfograma = mode === "games" && gameMode === "INFOGRAMA";
  const isWord = mode === "games" && gameMode === "ANAGRAM";
  const noOptions = isWord;

  const changeGameMode = (next: typeof gameMode) => {
    setGameMode(next);
    if (next === "ANAGRAM") {
      setQs((prev) => prev.map((q) => ({ ...q, options: [] })));
    } else if (next === "INFOGRAMA") {
      setQs((prev) => prev.map((q) => ({ ...q, options: padOptionsTo4(q.options) })));
    }
  };

  const isQuizMode = type === "PREGUNTADOS" || type === "CONTRARRELOJ";

  const changeType = (next: typeof type) => {
    setType(next);
    if (next === "PREGUNTADOS" || next === "CONTRARRELOJ") {
      setQs((prev) =>
        prev.map((q) => ({
          ...q,
          type: "MULTIPLE_CHOICE",
          timeSeconds: 0,
          options: padOptionsTo4(q.options),
        }))
      );
    }
  };

  const updateQ = (qi: number, patch: Partial<QuestionDraft>) => {
    setQs((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  };
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(() => (noOptions ? emptyQuestion() : newQuestion()));
  const openCreateModal = () => {
    setDraft(noOptions ? emptyQuestion() : newQuestion());
    setCreating(true);
  };
  const submitDraft = () => {
    setQs((prev) => [...prev, draft]);
    setCreating(false);
  };
  const removeQ = (qi: number) => setQs((prev) => prev.filter((_, i) => i !== qi));

  return (
    <>
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="type" value={mode === "games" ? "GAME" : type} />
      <input type="hidden" name="gameMode" value={type === "GAME" ? gameMode : ""} />
      <input type="hidden" name="optionMode" value={isQuizMode ? optionMode : "TEXT"} />
      <input
        type="hidden"
        name="timeSeconds"
        value={isQuizMode && type === "CONTRARRELOJ" ? String(seconds) : ""}
      />
      <input type="hidden" name="temaId" value={temaId} />
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
                  onChange={(e) => changeType(e.target.value as typeof type)}
                  className={inputCls}
                  style={{ width: "auto" }}
                >
                  <option value="LESSON">Lección</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="GAME">Juego</option>
                  <option value="PREGUNTADOS">Preguntados (A-D · 3 vidas)</option>
                  <option value="CONTRARRELOJ">Contrarreloj (A-D · tiempo · 3 vidas)</option>
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
                  <option value="ANAGRAM">Palabra a Gol (palabras)</option>
                </select>
              </label>
            )}
            {isQuizMode && (
              <>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                  Opciones
                  <select
                    value={optionMode}
                    onChange={(e) => setOptionMode(e.target.value as typeof optionMode)}
                    className={inputCls}
                    style={{ width: "auto" }}
                  >
                    <option value="TEXT">Solo texto</option>
                    <option value="IMAGE">Solo imagen</option>
                    <option value="BOTH">Texto e imagen</option>
                  </select>
                </label>
                {type === "CONTRARRELOJ" && (
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                    Segundos
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={seconds}
                      onChange={(e) => setSeconds(Math.max(1, Number(e.target.value)))}
                      className={`${inputCls} w-20`}
                    />
                  </label>
                )}
              </>
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              Tema
              {(() => {
                const seen = new Set<string>();
                return (
                  <select value={temaId} onChange={(e) => setTemaId(e.target.value)} className={inputCls} style={{ width: "auto" }}>
                    <option value="">Sin tema</option>
                    {clases.map((e) => (
                      <optgroup key={e.id} label={`${e.emoji} ${e.name}`}>
                        {e.temas.map((m) => {
                          if (seen.has(m.id)) return null;
                          seen.add(m.id);
                          return (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                );
              })()}
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
            onClick={openCreateModal}
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
              ) : null}
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

            <QuestionFields
              value={q}
              onChange={(patch) => updateQ(qi, patch)}
              isInfograma={isInfograma}
              isWord={isWord}
              noOptions={noOptions}
              radioName={`correct-${qi}`}
              isQuizMode={isQuizMode}
              showOptionImages={isQuizMode && optionMode !== "TEXT"}
            />
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

      {creating && (
        <Modal
          open={creating}
          onClose={() => setCreating(false)}
          title="Nueva pregunta"
          size="lg"
        >
          <div className="space-y-3">
            <QuestionFields
              value={draft}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              isInfograma={isInfograma}
              isWord={isWord}
              noOptions={noOptions}
              radioName="draft-correct"
              isQuizMode={isQuizMode}
              showOptionImages={isQuizMode && optionMode !== "TEXT"}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 rounded-2xl border-2 border-green-200 py-3 text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400 dark:hover:bg-emerald-950/40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitDraft}
                className="flex-1 rounded-2xl bg-green-500 py-3 text-sm font-black text-white transition hover:bg-green-600 active:scale-95"
              >
                Añadir pregunta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
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
