"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/icons";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSetup() {
  const [state, setState] = useState<"idle" | "loading" | "enabled" | "unsupported">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      const t = setTimeout(() => setState("unsupported"), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setState(sub ? "enabled" : "idle");
      })
      .catch(() => {
        if (!cancelled) setState("idle");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setState("loading");
    setError("");
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) throw new Error("No se pudo guardar la suscripción");
      setState("enabled");
    } catch {
      setError("No se pudo activar. Asegúrate de permitir notificaciones en tu navegador.");
      setState("idle");
    }
  };

  if (state === "unsupported") {
    return (
      <p className="text-xs text-zinc-400">
        Tu navegador no soporta notificaciones push.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state === "enabled" ? (
        <p className="flex items-center gap-2 text-sm font-bold text-green-600">
          <BellIcon className="h-4 w-4" /> Notificaciones activadas
        </p>
      ) : (
        <button
          onClick={enable}
          disabled={state === "loading"}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-950 py-3 text-sm font-black text-white transition hover:bg-emerald-900 active:scale-95 disabled:opacity-50"
        >
          <BellIcon className="h-4 w-4" />
          {state === "loading" ? "Activando..." : "Activar notificaciones"}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
