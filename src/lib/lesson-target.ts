"use client";

let lessonId: string | null = null;

export function setLessonTarget(id: string | null) {
  lessonId = id;
}

export function getLessonTarget() {
  return lessonId;
}
