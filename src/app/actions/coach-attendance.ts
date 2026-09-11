"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";
import { saveSessionAttendance } from "@/lib/attendance/service";
import { isAttendanceStatus, sessionIdFor, type AttendanceStatus } from "@/domain/attendance/attendance-contract";

function requiredText(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function parseEntries(formData: FormData): { playerId: string; status: AttendanceStatus }[] {
  const raw = String(formData.get("entries") ?? "[]").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El detalle de asistencias no es JSON válido.");
  }
  if (!Array.isArray(parsed)) throw new Error("El detalle de asistencias debe ser una lista.");
  const entries: { playerId: string; status: AttendanceStatus }[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) throw new Error("Asistencia no válida.");
    const { playerId, status } = entry as { playerId?: unknown; status?: unknown };
    if (typeof playerId !== "string" || !playerId) throw new Error("Asistencia sin playerId.");
    if (typeof status !== "string" || !isAttendanceStatus(status)) {
      throw new Error(`Estado de asistencia no válido: ${String(status)}.`);
    }
    entries.push({ playerId, status });
  }
  if (entries.length === 0) throw new Error("Registra al menos una asistencia.");
  return entries;
}

export async function saveAttendanceSessionAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const date = requiredText(formData, "date");
  const label = requiredText(formData, "label");
  const sessionId = sessionIdFor(date, label);
  const result = await saveSessionAttendance({
    actor,
    clubId: requiredText(formData, "clubId"),
    sessionId,
    entries: parseEntries(formData),
  });
  revalidatePath("/coach/asistencia");
  return result;
}

export async function saveAttendanceSessionByIdAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const result = await saveSessionAttendance({
    actor,
    clubId: requiredText(formData, "clubId"),
    sessionId: requiredText(formData, "sessionId"),
    entries: parseEntries(formData),
  });
  revalidatePath("/coach/asistencia");
  return result;
}