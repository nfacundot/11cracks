"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { APP_BY_KEY, type AppKey } from "./apps";
import { AppLauncherContext, DesktopActionsContext } from "./launcher";
import { Goal50Chat } from "./chat";
import { Goal50Menu, Goal50TopBar } from "./menu";
import HotelScreen from "./screens/hotel-screen";
import LessonScreen from "./screens/lesson-screen";
import CanchaPreviewScreen from "./screens/cancha-preview-screen";
import CalendarScreen from "./screens/calendar-screen";
import ProfileScreen, { type ProfileData } from "./screens/profile-screen";
import SettingsScreen from "./screens/settings-screen";
import NotificationsScreen from "./screens/notifications-screen";
import MessagesScreen from "./screens/messages-screen";
import PlayerProfileScreen from "./screens/player-profile-screen";
import FriendsScreen from "./screens/friends-screen";
import { hydrateEnergy } from "@/lib/energy";
import { hydrateNeeds, type NeedKey } from "@/lib/needs";
import { runEscapeHandlers } from "@/lib/escape";
import { setLessonTarget } from "@/lib/lesson-target";
import { setCanchaTarget, type CanchaTarget } from "@/lib/cancha-target";
import { logout } from "@/actions/auth";

type WinBoxInstance = {
  body: HTMLElement;
  dom: HTMLElement;
  focus: () => void;
  close: (force?: boolean) => void;
  maximize: (state?: boolean) => void;
  restore: () => void;
  setTitle: (title: string) => void;
};

type WinBoxCtor = new (opts: Record<string, unknown>) => WinBoxInstance;

type WinState = {
  id: string;
  key: string;
  Component: ComponentType;
  box: WinBoxInstance;
  body: HTMLElement;
};

const RAIL_W = 76;
const TOP_H = 44;
const MOBILE_BAR_H = 64;

const subscribe = () => () => {};

/**
 * Escritorio GOAL50 dentro de /jugador/world.
 * El rail (menú) abre cada pantalla del tema en una ventana Winbox estilo
 * macOS (semáforos + botón de cerrar), maximizada por defecto.
 */
export function WorldDesktop({
  fontClassName,
  streak,
  coins,
  energy,
  bottles,
  kg,
  needs,
  profile,
}: {
  fontClassName: string;
  streak: number;
  coins: number;
  energy: number;
  bottles: number;
  kg: number;
  needs: Partial<Record<NeedKey, number>>;
  profile: ProfileData;
}) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [wins, setWins] = useState<WinState[]>([]);
  const winRootRef = useRef<HTMLDivElement | null>(null);
  const winboxRef = useRef<WinBoxCtor | null>(null);
  const winsRef = useRef<WinState[]>([]);

  useEffect(() => {
    hydrateEnergy(energy);
  }, [energy]);

  useEffect(() => {
    hydrateNeeds(needs);
  }, [needs]);

  useEffect(() => {
    const ping = () => {
      void fetch("/api/presence", { method: "POST" }).catch(() => {});
    };
    ping();
    const timer = window.setInterval(ping, 45000);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    winsRef.current = wins;
  }, [wins]);

  const ensureWinBox = useCallback(async (): Promise<WinBoxCtor | null> => {
    if (winboxRef.current) return winboxRef.current;
    // El bundle inyecta los estilos y expone window.WinBox (solo cliente).
    await import("winbox/dist/winbox.bundle.min.js");
    const ctor = (window as unknown as { WinBox?: WinBoxCtor }).WinBox;
    if (!ctor) return null;
    winboxRef.current = ctor;
    return ctor;
  }, []);

  const openWindow = useCallback(
    async (key: string, title: string, Component: ComponentType, opts?: { modal?: boolean; width?: number; height?: number; centered?: boolean }) => {
      const existing = winsRef.current.find((w) => w.key === key);
      if (existing) {
        existing.box.focus();
        return;
      }
      const root = winRootRef.current;
      const WinBox = await ensureWinBox();
      if (!root || !WinBox) return;
      const mobile = window.innerWidth < 768;
      const id = `goal50-${key}-${Date.now()}`;
      const base = {
        title,
        root,
        onclose: () => {
          winsRef.current = winsRef.current.filter((w) => w.id !== id);
          setWins((prev) => prev.filter((w) => w.id !== id));
          if (key === "lesson") {
            window.dispatchEvent(new CustomEvent("goal50:close-lesson"));
          }
        },
      };
      const box = opts?.centered
        ? new WinBox({
            ...base,
            class: "goal50-win goal50-dialog no-min no-max no-full",
            modal: opts?.modal,
            width: opts?.width ?? 380,
            height: opts?.height ?? 300,
            x: "center",
            y: "center",
          })
        : new WinBox({
            ...base,
            class: "goal50-win no-full",
            max: true,
            left: mobile ? 0 : RAIL_W,
            top: TOP_H,
            right: 0,
            bottom: mobile ? MOBILE_BAR_H : 0,
          });
      const entry: WinState = { id, key, Component, box, body: box.body };
      winsRef.current = [...winsRef.current, entry];
      setWins((prev) => [...prev, entry]);
    },
    [ensureWinBox],
  );

  const openApp = useCallback(
    async (key: string) => {
      const app = APP_BY_KEY[key as AppKey];
      if (!app) return;
      await openWindow(app.key, app.title, app.Component);
    },
    [openWindow],
  );

  const openHotel = useCallback(async () => {
    await openWindow("hotel", "Hotel ELEVEN CRACKS", HotelScreen);
  }, [openWindow]);

  const openLesson = useCallback(async () => {
    const width = Math.min(940, Math.max(540, Math.round(window.innerWidth * 0.82)));
    const height = Math.min(760, Math.max(460, Math.round(window.innerHeight * 0.84)));
    await openWindow("lesson", "Lección", LessonScreen, { modal: true, centered: true, width, height });
  }, [openWindow]);

  const openCancha = useCallback(async () => {
    const width = Math.min(460, Math.round(window.innerWidth * 0.9));
    const height = Math.min(780, Math.round(window.innerHeight * 0.9));
    await openWindow("cancha", "Alineación", CanchaPreviewScreen, { modal: true, centered: true, width, height });
  }, [openWindow]);

  const openCalendar = useCallback(async () => {
    await openWindow("calendar", "Calendario", CalendarScreen);
  }, [openWindow]);

  const openProfile = useCallback(async () => {
    const Screen = () => (
      <ProfileScreen profile={profile} streak={streak} coins={coins} bottles={bottles} kg={kg} />
    );
    await openWindow("profile", "Perfil de usuario", Screen);
  }, [openWindow, profile, streak, coins, bottles, kg]);

  const openSettings = useCallback(async () => {
    await openWindow("settings", "Configuración", SettingsScreen);
  }, [openWindow]);

  const openNotifications = useCallback(async () => {
    await openWindow("notifications", "Notificaciones", NotificationsScreen);
  }, [openWindow]);

  const openMessages = useCallback(
    async (userId?: string | null, focus = false) => {
      const existing = winsRef.current.find((w) => w.key === "messages");
      const Screen = () => <MessagesScreen initialUserId={userId ?? null} focusComposer={focus} />;
      await openWindow("messages", "Mensajes", Screen);
      if (userId) {
        // Si la ventana ya existía, el Screen no cambia su prop inicial; el
        // evento hace que la conversación cambie. Si es nueva, el evento se
        // pierde porque el componente aún no se ha montado; se reintenta.
        const notify = () =>
          window.dispatchEvent(new CustomEvent("goal50:messages-focus", { detail: { userId } }));
        notify();
        if (!existing) {
          window.setTimeout(notify, 0);
          window.setTimeout(notify, 250);
          window.setTimeout(notify, 800);
        }
      }
    },
    [openWindow],
  );

  const openPlayerProfile = useCallback(
    async (userId: string) => {
      const Screen = () => <PlayerProfileScreen userId={userId} />;
      await openWindow(`player-${userId}`, "Perfil de jugador", Screen);
    },
    [openWindow],
  );

  const openFriends = useCallback(async () => {
    await openWindow("friends", "Amigos", FriendsScreen);
  }, [openWindow]);

  const closeAll = useCallback(() => {
    for (const w of [...winsRef.current]) {
      try {
        w.box.close();
      } catch {
        /* ventana ya cerrada */
      }
    }
    winsRef.current = [];
    setWins([]);
  }, []);

  const confirmExit = useCallback(async () => {
    const WinBox = await ensureWinBox();
    if (!WinBox) return;
    const box = new WinBox({
      title: "Salir",
      class: "goal50-win goal50-dialog no-min no-max no-full",
      root: winRootRef.current ?? undefined,
      modal: true,
      width: 330,
      height: 168,
      x: "center",
      y: "center",
    });
    box.body.innerHTML = `
      <div class="goal50-dialog-body">
        <p class="goal50-dialog-title">¿Seguro que quieres salir?</p>
        <p class="goal50-dialog-text">Se cerrará tu sesión.</p>
        <div class="goal50-dialog-actions">
          <button type="button" data-action="cancel" class="goal50-btn goal50-btn--ghost">Cancelar</button>
          <button type="button" data-action="confirm" class="goal50-btn goal50-btn--danger">Salir</button>
        </div>
      </div>`;
    box.body.querySelector('[data-action="cancel"]')?.addEventListener("click", () => box.close());
    box.body.querySelector('[data-action="confirm"]')?.addEventListener("click", () => {
      box.close();
      void logout();
    });
  }, [ensureWinBox]);

  const actions = useMemo(() => ({ closeAll, confirmExit }), [closeAll, confirmExit]);

  useEffect(() => {
    const handler = () => {
      void openHotel();
    };
    window.addEventListener("goal50:hotel", handler);
    return () => window.removeEventListener("goal50:hotel", handler);
  }, [openHotel]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ lessonId?: string | null }>).detail;
      setLessonTarget(detail?.lessonId ?? null);
      void openLesson();
    };
    window.addEventListener("goal50:lesson", handler);
    return () => window.removeEventListener("goal50:lesson", handler);
  }, [openLesson]);

  useEffect(() => {
    const handler = () => {
      const lesson = winsRef.current.find((w) => w.key === "lesson");
      if (lesson) {
        try {
          lesson.box.close();
        } catch {
          /* ventana ya cerrada */
        }
      }
    };
    window.addEventListener("goal50:close-lesson", handler);
    return () => window.removeEventListener("goal50:close-lesson", handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CanchaTarget>).detail;
      setCanchaTarget(detail ?? null);
      void openCancha();
    };
    window.addEventListener("goal50:open-cancha", handler);
    return () => window.removeEventListener("goal50:open-cancha", handler);
  }, [openCancha]);

  useEffect(() => {
    const handler = () => {
      void openCalendar();
    };
    window.addEventListener("goal50:open-calendar", handler);
    return () => window.removeEventListener("goal50:open-calendar", handler);
  }, [openCalendar]);

  useEffect(() => {
    const handler = () => {
      void openProfile();
    };
    window.addEventListener("goal50:open-profile", handler);
    return () => window.removeEventListener("goal50:open-profile", handler);
  }, [openProfile]);

  useEffect(() => {
    const handler = () => {
      void openSettings();
    };
    window.addEventListener("goal50:open-settings", handler);
    return () => window.removeEventListener("goal50:open-settings", handler);
  }, [openSettings]);

  useEffect(() => {
    const handler = () => {
      void openNotifications();
    };
    window.addEventListener("goal50:open-notifications", handler);
    return () => window.removeEventListener("goal50:open-notifications", handler);
  }, [openNotifications]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; focus?: boolean }>).detail;
      void openMessages(detail?.userId ?? null, detail?.focus ?? false);
    };
    window.addEventListener("goal50:open-messages", handler);
    return () => window.removeEventListener("goal50:open-messages", handler);
  }, [openMessages]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId) void openPlayerProfile(detail.userId);
    };
    window.addEventListener("goal50:open-player-profile", handler);
    return () => window.removeEventListener("goal50:open-player-profile", handler);
  }, [openPlayerProfile]);

  useEffect(() => {
    const handler = () => {
      void openFriends();
    };
    window.addEventListener("goal50:open-friends", handler);
    return () => window.removeEventListener("goal50:open-friends", handler);
  }, [openFriends]);

  useEffect(() => {
    const handler = () => {
      const camino = winsRef.current.find((w) => w.key === "camino");
      if (camino) {
        try {
          camino.box.close();
        } catch {
          /* ventana ya cerrada */
        }
      }
    };
    window.addEventListener("goal50:start-lesson", handler);
    return () => window.removeEventListener("goal50:start-lesson", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      const lesson = winsRef.current.find((w) => w.key === "lesson");
      if (lesson) {
        try {
          lesson.box.close();
        } catch {
          /* ventana ya cerrada */
        }
      }
    };
    window.addEventListener("goal50:lesson-complete", handler);
    return () => window.removeEventListener("goal50:lesson-complete", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      const hotel = winsRef.current.find((w) => w.key === "hotel");
      if (hotel) {
        try {
          hotel.box.close();
        } catch {
          /* ventana ya cerrada */
        }
      }
    };
    window.addEventListener("goal50:enter-room", handler);
    return () => window.removeEventListener("goal50:enter-room", handler);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (runEscapeHandlers()) return;
      const stack = (window as unknown as { WinBox?: { stack?: () => WinBoxInstance[] } }).WinBox?.stack?.();
      const top = stack && stack.length ? stack[stack.length - 1] : winsRef.current[winsRef.current.length - 1]?.box;
      if (top) {
        try {
          top.close();
        } catch {
          /* ventana ya cerrada */
        }
        return;
      }
      window.dispatchEvent(new CustomEvent("goal50:close-chat"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(
    () => () => {
      for (const w of winsRef.current) {
        try {
          w.box.close(true);
        } catch {
          /* ventana ya cerrada */
        }
      }
    },
    [],
  );

  if (!isClient) return null;

  return createPortal(
    <AppLauncherContext.Provider value={openApp}>
      <DesktopActionsContext.Provider value={actions}>
        <div className={`goal50-ui ${fontClassName} pointer-events-none fixed inset-0 z-[200]`}>
          <div ref={winRootRef} className="absolute inset-0" />
          <Goal50TopBar streak={streak} coins={coins} bottles={bottles} kg={kg} />
          <Goal50Menu />
          <Goal50Chat />
        </div>
        {wins.map((w) => {
          const App = w.Component;
          return createPortal(
            <div className="goal50-ui h-full w-full">
              <App />
            </div>,
            w.body,
            w.id,
          );
        })}
      </DesktopActionsContext.Provider>
    </AppLauncherContext.Provider>,
    document.body,
  );
}
