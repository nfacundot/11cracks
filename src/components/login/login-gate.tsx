"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { restoreSession } from "@/actions/auth";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { snapshotStoredToken, clearStoredToken } from "@/lib/session-client";

type SheetMode = "login" | "register" | null;

const LoginStadium = dynamic(
  () => import("@/components/login/login-stadium").then((mod) => mod.LoginStadium),
  { ssr: false },
);

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function LoginGate() {
  const [sheet, setSheet] = useState<SheetMode>(null);
  const open = sheet !== null;
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkOrRestore() {
      const token = snapshotStoredToken();
      let data: { authenticated: boolean; home?: string } | null = null;
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        data = res.ok ? await res.json() : null;
      } catch {}

      let home = data?.home ?? null;
      let restoreFailed = false;

      if (!data?.authenticated && token) {
        try {
          const state = await restoreSession(token);
          if (state?.home) home = state.home;
          else {
            restoreFailed = true;
            clearStoredToken();
          }
        } catch {
          restoreFailed = true;
          clearStoredToken();
        }
        if (!restoreFailed && home) {
          data = { authenticated: true, home };
        }
      }

      if (cancelled) return;
      if (data?.authenticated && home) {
        router.replace(home);
      }
    }

    checkOrRestore();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <div className="login-gate">
        <div className="login-gate__hero" role="presentation">
          <LoginStadium />
        </div>
        <div className="login-gate__scrim" role="presentation" />

        <div className="login-gate__window">
          <Image
            src="/brand/11-cracks.svg"
            alt="11 Cracks"
            width={401}
            height={114}
            priority
          />
          <h1 className="login-gate__title">
            Entra en tu mundo
          </h1>
          <p className="login-gate__lead">
            Aprende fútbol paso a paso: lecciones, juegos y tu propio camino de crack.
          </p>
          <div className="login-gate__actions">
            <button
              type="button"
              className="login-gate__btn login-gate__btn--primary"
              onClick={() => setSheet("login")}
            >
              Login
            </button>
            <button
              type="button"
              className="login-gate__btn"
              onClick={() => setSheet("register")}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>

      <div
        className={`login-sheet-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setSheet(null)}
        aria-hidden="true"
      />

      <div
        className={`login-sheet ${open ? "is-open" : ""} ${sheet === "register" ? "login-sheet--register" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-sheet-title"
      >
        <div className="login-sheet__handle" aria-hidden="true" />
        <div className="login-sheet__head">
          <h2 id="auth-sheet-title" className="login-sheet__title">
            {sheet === "register" ? "Crear cuenta" : "Iniciar sesión"}
          </h2>
          <button
            type="button"
            className="login-sheet__close"
            onClick={() => setSheet(null)}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        {sheet === "register" ? <RegisterForm /> : null}
        {sheet === "login" ? <LoginForm /> : null}
      </div>
    </>
  );
}