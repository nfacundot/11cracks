"use client";

import { useState } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { BallLogo } from "@/components/ball-logo";
import { UserIcon, UserPlusIcon } from "@/components/icons";

export function AuthTabs() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="w-full max-w-xs">
      <div className="mb-6 flex justify-center">
        <BallLogo size={120} src="/img/icons/icontas.png" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-xs font-bold uppercase tracking-wider transition ${
            tab === "login"
              ? "border-[#8cb62e] bg-black/60 text-[#8cb62e] shadow-[0_0_12px_rgba(140,182,46,0.25)]"
              : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
          }`}
        >
          <UserIcon className="h-5 w-5" />
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-xs font-bold uppercase tracking-wider transition ${
            tab === "register"
              ? "border-[#8cb62e] bg-black/60 text-[#8cb62e] shadow-[0_0_12px_rgba(140,182,46,0.25)]"
              : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
          }`}
        >
          <UserPlusIcon className="h-5 w-5" />
          ¿Primera vez?
        </button>
      </div>

      <div className="min-h-[320px]">
        {tab === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
