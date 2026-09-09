export type ContextualSurface = "goal-board" | "locker-panel" | "context-panel";

export function getContextualSurface(placement: string): ContextualSurface {
  switch (placement.trim().toUpperCase()) {
    case "GOAL_SIDELINE_LEFT":
    case "GOAL_SIDELINE_RIGHT":
    case "GOAL_BACKBOARD":
    case "SIDELINE_BOARD":
    case "SCOREBOARD":
      return "goal-board";
    case "LOCKER_PANEL":
    case "BALL_RACK":
    case "TRAINING_BIB_AREA":
    case "HYDRATION_STATION":
      return "locker-panel";
    default:
      return "context-panel";
  }
}

export function getContextualSurfaceLabel(surface: ContextualSurface): string {
  switch (surface) {
    case "goal-board":
      return "BANDA LATERAL";
    case "locker-panel":
      return "PANEL DE EQUIPO";
    default:
      return "SUPERFICIE CONTEXTUAL";
  }
}
