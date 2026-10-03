"use client";

import type { ComponentType, ReactNode } from "react";
import ProgressScreen from "./screens/progress-screen";
import TrainingScreen from "./screens/training-screen";
import CaminoScreen from "./screens/camino-screen";
import VideosScreen from "./screens/videos-screen";
import AlineacionScreen from "./screens/alineacion-screen";
import InventoryScreen from "./screens/inventory-screen";
import FriendsScreen from "./screens/friends-screen";

export type AppKey =
  | "progreso"
  | "entrenamiento"
  | "camino"
  | "videos"
  | "alineacion"
  | "inventario"
  | "friends";

export type AppDef = {
  key: AppKey;
  label: string;
  title: string;
  icon: ReactNode;
  Component: ComponentType;
};

function Ico({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const APPS: AppDef[] = [
  {
    key: "progreso",
    label: "Mi Progreso",
    title: "Mi Progreso",
    icon: <Ico><path d="M4 19V5M4 19h16M8 16V9M12 16v-4M16 16v-8" /></Ico>,
    Component: ProgressScreen,
  },
  {
    key: "entrenamiento",
    label: "Mi entrenamiento",
    title: "Mi entrenamiento",
    icon: <Ico><path d="M6.5 6.5v11M17.5 6.5v11M4 9v6M20 9v6M6.5 12h11" /></Ico>,
    Component: TrainingScreen,
  },
  {
    key: "camino",
    label: "El Camino",
    title: "El Camino",
    icon: <Ico><path d="M6 20c0-3 3-3 3-6s-3-3-3-6 3-3 3-6M15 20c0-3 3-3 3-6s-3-3-3-6 3-3 3-6" /></Ico>,
    Component: CaminoScreen,
  },
  {
    key: "videos",
    label: "Videos",
    title: "Videos",
    icon: <Ico><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9.2 15 12l-5 2.8V9.2Z" /></Ico>,
    Component: VideosScreen,
  },
  {
    key: "alineacion",
    label: "Alineación",
    title: "Alineación",
    icon: <Ico><circle cx="12" cy="7" r="2.6" /><circle cx="6" cy="15" r="2.6" /><circle cx="18" cy="15" r="2.6" /><path d="M12 9.6 7.5 13M12 9.6l4.5 3.4M7 16.5 10 20m7-3.5L14 20" /></Ico>,
    Component: AlineacionScreen,
  },
  {
    key: "inventario",
    label: "Inventario",
    title: "Inventario",
    icon: <Ico><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" /><path d="M4 7.5 12 11l8-3.5M12 11v9" /></Ico>,
    Component: InventoryScreen,
  },
  {
    key: "friends",
    label: "Amigos",
    title: "Amigos",
    icon: <Ico><circle cx="9" cy="8" r="3.2" /><path d="M3.4 19.2c.9-3.1 3.1-4.8 5.6-4.8s4.7 1.7 5.6 4.8" /><path d="M16.2 5.6a3 3 0 0 1 0 5.4M17.6 14.6c1.6.6 2.7 2 3.3 4.1" /></Ico>,
    Component: FriendsScreen,
  },
];

export const APP_BY_KEY: Record<AppKey, AppDef> = APPS.reduce((acc, app) => {
  acc[app.key] = app;
  return acc;
}, {} as Record<AppKey, AppDef>);
