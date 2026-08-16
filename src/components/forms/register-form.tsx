"use client";

import { useState } from "react";
import { useActionState } from "react";
import { register, type AuthState } from "@/actions/auth";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { AuthLoading } from "@/components/auth-loading";

const inputCls =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3.5 font-medium text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-green-500 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-white dark:placeholder-emerald-300/50 dark:focus:border-green-400";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, undefined);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-xl bg-red-100 p-3 text-sm font-semibold text-red-600 dark:bg-red-500/20 dark:text-red-200">
          {state.error}
        </p>
      )}

      {pending && <AuthLoading label="Creando cuenta…" />}

      <input
        name="name"
        type="text"
        required
        minLength={2}
        autoComplete="name"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputCls}
      />
      <input
        name="username"
        type="text"
        required
        minLength={3}
        autoComplete="username"
        placeholder="Usuario (ej: crack10)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={inputCls}
      />
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <div className="relative">
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Contraseña (mínimo 6)"
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

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600 active:scale-95 disabled:opacity-60 dark:shadow-green-900/40"
      >
        {pending ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
