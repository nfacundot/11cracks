export type CalendarEvent = { id: string; date: string; title: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCalendarEvents(value: unknown): CalendarEvent[] {
  if (!Array.isArray(value)) return [];
  const events: CalendarEvent[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.date !== "string" || typeof item.title !== "string") continue;
    if (!DATE_RE.test(item.date)) continue;
    const title = item.title.trim().slice(0, 80);
    if (!title) continue;
    events.push({ id: item.id.slice(0, 64), date: item.date, title });
  }
  return events.slice(0, 500);
}
