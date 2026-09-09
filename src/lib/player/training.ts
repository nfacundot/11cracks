export type TrainingContentStatus = "pending" | "in-progress" | "completed";

export interface PlayerTrainingNextTraining {
  sessionType: string;
  location: string;
  dateLabel: string;
  startsAt: string;
  timeLabel: string;
  context: string;
}

export interface PlayerTrainingScheduleItem {
  id: string;
  startsAt: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  title: string;
  location: string;
  status: "upcoming" | "completed";
}

export interface PlayerTrainingSession {
  id: string;
  dateLabel: string;
  title: string;
  attendance: "Asististe" | "Pendiente";
  hours: number;
  validation: "Validadas" | "Pendientes";
}

export interface PlayerTrainingFixture {
  nextTraining: PlayerTrainingNextTraining | null;
  coachFocus: { message: string; context: string; dateLabel: string; dimension: string } | null;
  recommendation: { title: string; description: string; duration: string; status: TrainingContentStatus };
  week: readonly PlayerTrainingScheduleItem[];
  sessions: readonly PlayerTrainingSession[];
  hours: { registered: number; validated: number; pending: number; totalValidated: number; target: number };
}

export function buildPlayerTrainingFixture(): PlayerTrainingFixture {
  return {
    nextTraining: {
      sessionType: "Técnica y táctica",
      location: "Cancha principal",
      dateLabel: "Sáb, 06 Sep",
      startsAt: "2026-09-06T17:30:00-04:00",
      timeLabel: "5:30 PM",
      context: "11 Cracks",
    },
    coachFocus: {
      message: "Sigue trabajando tu próximo objetivo técnico y comprime los tiempos de decisión en cada posesión.",
      context: "Seguimiento reciente",
      dateLabel: "12 ago 2026",
      dimension: "Desarrollo técnico",
    },
    recommendation: {
      title: "Decisión bajo presión",
      description: "Video recomendado por tu entrenador",
      duration: "4 min",
      status: "pending",
    },
    week: [
      { id: "week-mon", startsAt: "2026-08-24T17:30:00-04:00", dayLabel: "LUN", dateLabel: "24 AGO", timeLabel: "5:30 PM", title: "Técnica individual", location: "Cancha principal", status: "completed" },
      { id: "week-next", startsAt: "2026-09-06T17:30:00-04:00", dayLabel: "SÁB", dateLabel: "06 SEP", timeLabel: "5:30 PM", title: "Técnica y táctica", location: "Cancha principal", status: "upcoming" },
      { id: "week-fri", startsAt: "2026-08-28T17:30:00-04:00", dayLabel: "VIE", dateLabel: "28 AGO", timeLabel: "5:30 PM", title: "Definición", location: "Cancha principal", status: "completed" },
    ],
    sessions: [
      { id: "session-1", dateLabel: "12 AGO", title: "Entrenamiento técnico", attendance: "Asististe", hours: 2, validation: "Validadas" },
      { id: "session-2", dateLabel: "08 AGO", title: "Trabajo táctico", attendance: "Asististe", hours: 2, validation: "Pendientes" },
    ],
    hours: { registered: 12, validated: 10, pending: 2, totalValidated: 0, target: 540 },
  };
}