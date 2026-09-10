"use client";

import { useActionState, useEffect, useState, type FormEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { login, type AuthState } from "@/actions/auth";
import { playLoginAudio } from "@/lib/audio/audio-manager";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.75 6.75h16.5v10.5H3.75z" />
      <path d="m4.5 7.5 7.5 5.25 7.5-5.25" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.5" y="10" width="13" height="10" rx="1.5" />
      <path d="M8.25 10V7.5a3.75 3.75 0 0 1 7.5 0V10" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-5.25 9.5-5.25S21.5 12 21.5 12 18 17.25 12 17.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.4" />
      {!open && <path d="m4 4 16 16" />}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M14 7l5 5-5 5" />
    </svg>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!state?.error) return;
    playLoginAudio("ui.error");
  }, [state?.error]);

  function handlePointerEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") playLoginAudio("ui.hover");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!event.currentTarget.checkValidity()) return;
    const trace = document.querySelector<HTMLElement>(".login-energy-trace");
    trace?.classList.remove("is-active");
    void trace?.offsetWidth;
    trace?.classList.add("is-active");
    playLoginAudio("ui.confirm");
    document.documentElement.dataset.loginTransition = "leaving";
    window.setTimeout(() => {
      delete document.documentElement.dataset.loginTransition;
    }, 600);
  }

  const errorModal =
    state?.error
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-black/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <p className="mb-4 text-center text-sm font-bold uppercase text-red-400">
                {state.error}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold uppercase text-white transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <form action={action} className="login-form" onSubmit={handleSubmit}>
      {errorModal}

      <div className="field-group">
        <label htmlFor="email">Correo electrónico</label>
        <div className="input-shell">
          <span className="input-shell__icon"><MailIcon /></span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={pending}
            onPointerEnter={handlePointerEnter}
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="password">Contraseña</label>
        <div className="input-shell">
          <span className="input-shell__icon"><LockIcon /></span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={pending}
          />
          <button
            className="password-toggle"
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            onPointerEnter={handlePointerEnter}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      <button className="forgot-link" type="button" onPointerEnter={handlePointerEnter}>
        ¿Olvidaste tu contraseña?
      </button>

      <button className="login-submit" type="submit" disabled={pending} onPointerEnter={handlePointerEnter}>
        <span>{pending ? "Preparando acceso" : "Entrar"}</span>
        {pending ? <span className="login-spinner" aria-hidden="true" /> : <ArrowIcon />}
      </button>
    </form>
  );
}
