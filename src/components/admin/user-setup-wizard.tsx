"use client";

import { useState, useActionState, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon, ShieldIcon, UsersIcon, CheckIcon } from "@/components/icons";
import { selfSetRole, validateClubCode, selfCreateTeam, selfJoinTeam, type ClubCodeResult } from "@/actions/team";

type WizardStep = "role" | "coach" | "player" | "done";

const INPUT = "w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-[#F2F0E9] placeholder:text-[#686862] outline-none transition focus:border-[#C9A24A]/50 focus:bg-white/[0.06]";
const LABEL = "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#686862]";

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 px-6 pt-5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all ${
              i < current
                ? "bg-[#C9A24A] text-[#080909]"
                : i === current
                  ? "border-2 border-[#C9A24A] text-[#C9A24A]"
                  : "border border-white/10 text-[#686862]"
            }`}
          >
            {i < current ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-[2px] w-8 transition-colors ${i < current ? "bg-[#C9A24A]" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function RoleStep({ onSelect }: { onSelect: (role: "coach" | "player") => void }) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <span className={LABEL}>Paso 1</span>
        <h4 className="mt-1 text-base font-black text-[#F2F0E9]">Seleccionar rol del usuario</h4>
        <p className="mt-1 text-xs text-[#686862]">Define si será Entrenador o Jugador para continuar con la configuración.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect("coach")}
          className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#C9A24A]/40 hover:bg-[#C9A24A]/5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A24A]/20 bg-[#C9A24A]/10 transition group-hover:bg-[#C9A24A]/20">
            <ShieldIcon className="h-6 w-6 text-[#C9A24A]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-[#F2F0E9]">Entrenador</p>
            <p className="mt-1 text-[11px] text-[#686862]">Crea un equipo nuevo y sube el logo</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelect("player")}
          className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#C9A24A]/40 hover:bg-[#C9A24A]/5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A24A]/20 bg-[#C9A24A]/10 transition group-hover:bg-[#C9A24A]/20">
            <UsersIcon className="h-6 w-6 text-[#C9A24A]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-[#F2F0E9]">Jugador</p>
            <p className="mt-1 text-[11px] text-[#686862]">Ingresa el código del club para unirse</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function CoachStep({ userName, userId, onBack, onDone }: { userName: string; userId: string; onBack: () => void; onDone: (msg: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [state, formAction, pending] = useActionState(async (_prev: { error?: string; success?: string } | undefined, formData: FormData) => {
    const name = String(formData.get("teamName") || "");
    const logo = String(formData.get("logoUrl") || "");
    const userId = String(formData.get("userId") || "");
    return selfCreateTeam(userId, name, logo || undefined);
  }, undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        setLogoPreview(URL.createObjectURL(file));
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  if (state?.success) {
    onDone(state.success);
  }

  return (
    <form
      action={(data) => {
        data.set("userId", userId);
        formAction(data);
      }}
      className="flex flex-col gap-4 p-6"
    >
      <input type="hidden" name="userId" value={userId} />

      <div>
        <span className={LABEL}>Paso 2 · Entrenador</span>
        <h4 className="mt-1 text-base font-black text-[#F2F0E9]">Crear equipo para {userName}</h4>
        <p className="mt-1 text-xs text-[#686862]">Define el nombre del equipo y sube un logo institucional.</p>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400">{state.error}</p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Nombre del equipo *</span>
        <input
          name="teamName"
          required
          maxLength={40}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Ej: Forjadores Pro"
          className={INPUT}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Logo del equipo</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] text-[#686862] transition hover:border-[#C9A24A]/40 hover:text-[#C9A24A]"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full rounded-lg object-cover" />
            ) : (
              <span className="text-2xl">+</span>
            )}
          </button>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-[#686862]">{logoPreview ? "Logo seleccionado" : "Click para subir logo"}</p>
            <p className="text-[10px] text-[#686862]/60">PNG, JPG o WebP · Max 5MB</p>
            {uploading && <p className="text-[10px] text-[#C9A24A]">Subiendo...</p>}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleLogo(e.target.files?.[0])}
          />
        </div>
        <input type="hidden" name="logoUrl" value={logoUrl ?? ""} />
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
        <button type="button" onClick={onBack} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-black text-[#686862] transition hover:bg-white/5 hover:text-[#F2F0E9]">
          Atrás
        </button>
        <button type="submit" disabled={pending || !teamName.trim()} className="rounded-xl bg-[#C9A24A] px-6 py-2.5 text-sm font-black text-[#080909] transition hover:bg-[#d4ad5a] disabled:opacity-40 active:scale-95">
          {pending ? "Creando..." : "Crear equipo"}
        </button>
      </div>
    </form>
  );
}

function PlayerStep({ userName, userId, onBack, onDone }: { userName: string; userId: string; onBack: () => void; onDone: (msg: string) => void }) {
  const [code, setCode] = useState("");
  const [validation, setValidation] = useState<ClubCodeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setCode(upper);
    setValidation(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (upper.length >= 4) {
      debounceRef.current = setTimeout(async () => {
        setChecking(true);
        const result = await validateClubCode(upper);
        setValidation(result);
        setChecking(false);
      }, 500);
    }
  };

  const handleJoin = async () => {
    if (!validation?.valid || !validation.team) return;
    setJoining(true);
    const result = await selfJoinTeam(userId, validation.team.code);
    if (result?.success) {
      onDone(result.success);
    }
    setJoining(false);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <span className={LABEL}>Paso 2 · Jugador</span>
        <h4 className="mt-1 text-base font-black text-[#F2F0E9]">Unirse a un equipo para {userName}</h4>
        <p className="mt-1 text-xs text-[#686862]">Ingresa el código de invitación del equipo.</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Código del club</span>
        <input
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="A1B2C3D4"
          maxLength={8}
          className={`${INPUT} text-center font-mono text-lg tracking-[0.3em] uppercase`}
        />
      </label>

      {checking && (
        <div className="flex items-center gap-2 text-xs text-[#C9A24A]">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#C9A24A] border-t-transparent" />
          Validando código...
        </div>
      )}

      {validation && !checking && (
        <div className={`rounded-xl border p-4 transition ${
          validation.valid
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}>
          {validation.valid && validation.team ? (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                {validation.team.logoUrl ? (
                  <img src={validation.team.logoUrl} alt={validation.team.name} className="h-full w-full object-cover" />
                ) : (
                  <ShieldIcon className="h-7 w-7 text-[#686862]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#F2F0E9] truncate">{validation.team.name}</p>
                <p className="text-[11px] text-[#686862]">{validation.team.memberCount} miembro(s)</p>
                <p className="font-mono text-[10px] font-bold text-[#C9A24A] tracking-widest">{validation.team.code}</p>
              </div>
              <CheckIcon className="h-5 w-5 shrink-0 text-emerald-400" />
            </div>
          ) : (
            <p className="text-sm font-bold text-red-400">{validation.error}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
        <button type="button" onClick={onBack} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-black text-[#686862] transition hover:bg-white/5 hover:text-[#F2F0E9]">
          Atrás
        </button>
        <button
          type="button"
          onClick={handleJoin}
          disabled={!validation?.valid || joining}
          className="rounded-xl bg-[#C9A24A] px-6 py-2.5 text-sm font-black text-[#080909] transition hover:bg-[#d4ad5a] disabled:opacity-40 active:scale-95"
        >
          {joining ? "Uniendo..." : "Unirse al equipo"}
        </button>
      </div>
    </div>
  );
}

function DoneStep({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
        <CheckIcon className="h-8 w-8 text-emerald-400" />
      </div>
      <div>
        <h4 className="text-base font-black text-[#F2F0E9]">Configuración completada</h4>
        <p className="mt-2 text-sm text-[#686862]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl bg-[#C9A24A] px-8 py-2.5 text-sm font-black text-[#080909] transition hover:bg-[#d4ad5a]"
      >
        Cerrar
      </button>
    </div>
  );
}

export function UserSetupWizard({
  open,
  onClose,
  userName,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
}) {
  const [step, setStep] = useState<WizardStep>("role");
  const [role, setRole] = useState<"coach" | "player" | null>(null);
  const [doneMessage, setDoneMessage] = useState("");

  if (!open) return null;

  const handleRoleSelect = (r: "coach" | "player") => {
    if (userId) {
      selfSetRole(userId, r);
    }
    setRole(r);
    setStep(r === "coach" ? "coach" : "player");
  };

  const handleDone = (msg: string) => {
    setDoneMessage(msg);
    setStep("done");
  };

  const stepIndex = step === "role" ? 0 : step === "done" ? 2 : 1;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#050606]/80 backdrop-blur-[2px]" />
      <div className="animate-pop relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#C9A24A]/10 bg-[#080909]/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#C9A24A]/10 px-6 py-5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A24A]">CONFIGURACIÓN</span>
            <h3 className="mt-1 text-base font-black text-[#F2F0E9]">Configuraciones adicionales para {userName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-white/5 p-2 text-[#686862] transition hover:bg-white/10 hover:text-[#F2F0E9]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <StepIndicator current={stepIndex} total={3} />

        <div className="max-h-[65vh] overflow-y-auto">
          {step === "role" && <RoleStep onSelect={handleRoleSelect} />}
          {step === "coach" && <CoachStep userName={userName} userId={userId} onBack={() => setStep("role")} onDone={handleDone} />}
          {step === "player" && <PlayerStep userName={userName} userId={userId} onBack={() => setStep("role")} onDone={handleDone} />}
          {step === "done" && <DoneStep message={doneMessage} onClose={onClose} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
