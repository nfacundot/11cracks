"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/admin/modal";
import { LessonEditor } from "@/components/admin/lesson-editor";
import { getEditableLesson } from "@/actions/admin";
import type { EditableLessonData } from "@/actions/admin";

type EditorClase = {
  id: string;
  name: string;
  emoji: string;
  temas: { id: string; name: string }[];
};

export function LessonEditorModal({
  clases,
  mode,
  lessonId,
  label,
  title,
  className,
  initialType,
  open: openProp,
  onClose: onCloseProp,
}: {
  clases: EditorClase[];
  mode: "lessons" | "games";
  lessonId?: string;
  label: React.ReactNode;
  title: string;
  className?: string;
  initialType?: "LESSON" | "QUIZ" | "GAME" | "PREGUNTADOS" | "CONTRARRELOJ";
  open?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<EditableLessonData | null>(null);
  const [loading, setLoading] = useState(false);

  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : open;

  const openModal = async () => {
    if (isControlled) return;
    setOpen(true);
    if (!lessonId) return;
    setLoading(true);
    try {
      const d = await getEditableLesson(lessonId);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (isControlled) {
      setData(null);
      onCloseProp?.();
    } else {
      setOpen(false);
      setData(null);
    }
  };

  const handleSaved = () => {
    close();
    router.refresh();
  };

  return (
    <>
      {!isControlled ? (
        <button type="button" onClick={() => void openModal()} className={className}>
          {label}
        </button>
      ) : null}
      <Modal open={isOpen} onClose={close} title={title} size="xl">
        {lessonId && loading ? (
          <div className="py-16 text-center text-sm font-bold text-zinc-400">Cargando…</div>
        ) : lessonId && !data ? (
          <div className="py-16 text-center text-sm font-bold text-red-500">
            No se pudo cargar el contenido.
          </div>
        ) : (
          <LessonEditor
            clases={clases}
            mode={mode}
            initialType={initialType}
            defaultValues={data?.defaultValues}
            questions={data?.questions}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </>
  );
}
