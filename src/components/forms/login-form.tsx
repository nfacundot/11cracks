"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createPortal } from "react-dom";
import { login, type AuthState } from "@/actions/auth";
import { EyeIcon, EyeOffIcon, ChevronRightIcon, XIcon } from "@/components/icons";
import { AuthLoading } from "@/components/auth-loading";

const inputCls =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3.5 font-medium text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-green-500 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-white dark:placeholder-emerald-300/50 dark:focus:border-green-400";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
                <XIcon className="h-4 w-4" />
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <form action={action} className="flex flex-col items-center gap-4">
      {errorModal}

      {pending && <AuthLoading label="Iniciando sesión…" />}

      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="EMAIL"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <div className="relative w-full">
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="CONTRASEÑA"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputCls} pr-12`}
        />
        <button
          type="button"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-3 text-zinc-400 transition hover:text-zinc-600 dark:text-emerald-300/60 dark:hover:text-emerald-200"
        >
          {showPassword ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex w-full items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-zinc-300 accent-green-500 dark:border-emerald-700"
          />
          Guardar credenciales
        </label>
        <button
          type="button"
          className="text-xs font-bold uppercase text-zinc-400 transition hover:text-zinc-300 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          ¿Olvidaste contraseña?
        </button>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-lg font-black uppercase text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600 active:scale-95 disabled:opacity-60 dark:shadow-green-900/40"
      >
        {pending ? "Ingresando…" : "Ingresar"}
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </form>
  );
}
