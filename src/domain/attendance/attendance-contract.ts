export type AttendanceStatus = "PRESENT" | "ABSENT" | "PENDING";

const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ["PRESENT", "ABSENT", "PENDING"];

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return (ATTENDANCE_STATUSES as readonly string[]).includes(value);
}

export function sessionIdFor(date: string, label: string): string {
  const cleanLabel = label.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!date || !cleanLabel) {
    throw new Error("Fecha y nombre de sesión son obligatorios.");
  }
  return `${date} :: ${cleanLabel}`;
}

export function sessionLabelOf(sessionId: string): string {
  const separator = sessionId.indexOf(" :: ");
  return separator === -1 ? sessionId : sessionId.slice(separator + 4);
}

export function sessionDateOf(sessionId: string): string {
  const separator = sessionId.indexOf(" :: ");
  return separator === -1 ? "" : sessionId.slice(0, separator);
}

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Asistió",
  ABSENT: "Ausente",
  PENDING: "Pendiente",
};