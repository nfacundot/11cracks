"use client";

import { useState, type PointerEvent } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { playLoginAudio } from "@/lib/audio/audio-manager";

export function AuthTabs() {
  const [tab, setTab] = useState<"login" | "register">("login");

  function handlePointerEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") playLoginAudio("ui.hover");
  }

  return (
    <div className="login-auth">
      <div className="login-tabs" role="tablist" aria-label="Acceso a la plataforma">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "login"}
          className={tab === "login" ? "is-active" : ""}
          onClick={() => setTab("login")}
          onPointerEnter={handlePointerEnter}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "register"}
          className={tab === "register" ? "is-active" : ""}
          onClick={() => setTab("register")}
          onPointerEnter={handlePointerEnter}
        >
          Crear cuenta
        </button>
      </div>

      {tab === "login" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}
