"use client";

import { useRef, useState, useTransition, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import { register } from "@/actions/auth";
import { validateClubCode, type ClubCodeResult } from "@/actions/team";
import { playLoginAudio } from "@/lib/audio/audio-manager";
import { DEFAULT_AVATAR_CONFIG, type AvatarConfig } from "@/lib/avatar";

const AvatarCreator3D = dynamic(
  () => import("@/components/login/avatar-creator-3d").then((mod) => mod.AvatarCreator3D),
  {
    ssr: false,
    loading: () => <div className="av3d__loading">Abriendo el estudio 3D…</div>,
  },
);

type Role = "player" | "coach";
type Phase = "role" | "team" | "avatar" | "account" | "consent";

const PHASES: Phase[] = ["role", "team", "avatar", "account", "consent"];

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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
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

function StepBar({ current }: { current: Phase }) {
  const index = PHASES.indexOf(current);
  return (
    <div className="rw-steps" aria-hidden="true">
      {PHASES.map((phase, i) => (
        <span
          key={phase}
          className={`rw-step ${i < index ? "is-done" : i === index ? "is-active" : ""}`}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

export function RegisterForm() {
  const [phase, setPhase] = useState<Phase>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);

  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  const [teamCode, setTeamCode] = useState("");
  const [teamValidation, setTeamValidation] = useState<ClubCodeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [teamName, setTeamName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hover = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") playLoginAudio("ui.hover");
  };

  const go = (next: Phase) => {
    setError(null);
    playLoginAudio("ui.confirm");
    setPhase(next);
  };

  const selectRole = (next: Role) => {
    setRole(next);
    setError(null);
    playLoginAudio("ui.confirm");
    setPhase("team");
  };

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setTeamCode(upper);
    setTeamValidation(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (upper.length >= 4) {
      setChecking(true);
      debounceRef.current = setTimeout(async () => {
        const result = await validateClubCode(upper);
        setTeamValidation(result);
        setChecking(false);
      }, 450);
    } else {
      setChecking(false);
    }
  };

  const handleLogo = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("El logo no puede superar 5MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (data.url) {
        setLogoUrl(data.url);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setError(data.error ?? "No se pudo subir el logo");
      }
    } catch {
      setError("No se pudo subir el logo");
    }
    setUploading(false);
  };

  const teamLogoForAvatar = () => {
    if (role === "player") return teamValidation?.team?.logoUrl ?? null;
    return logoUrl;
  };

  const goToAvatar = () => {
    if (role === "coach" && teamName.trim().length < 2) {
      setError("Escribe el nombre del equipo");
      return;
    }
    const logo = teamLogoForAvatar();
    if (logo) {
      setAvatar((current) => ({ ...current, shield: "custom", shieldUrl: logo }));
    }
    go("avatar");
  };

  const validateAccount = () => {
    if (name.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return "El usuario debe tener 3-20 letras, números o guion bajo";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Email inválido";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    return null;
  };

  const goToConsent = () => {
    const message = validateAccount();
    if (message) {
      setError(message);
      playLoginAudio("ui.error");
      return;
    }
    go("consent");
  };

  const finalize = () => {
    if (!role) return;
    if (role === "player" && !teamValidation?.valid) {
      setError("Selecciona un equipo válido");
      playLoginAudio("ui.error");
      return;
    }
    if (!consent) {
      setError("Debes aceptar el consentimiento para continuar");
      playLoginAudio("ui.error");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("username", username);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", role);
    formData.set("avatarConfig", JSON.stringify(avatar));
    formData.set("consent", "true");
    if (role === "player") {
      formData.set("teamCode", teamCode);
    } else {
      formData.set("teamName", teamName);
      formData.set("logoUrl", logoUrl ?? "");
    }

    setError(null);
    playLoginAudio("ui.confirm");
    startTransition(async () => {
      try {
        const state = await register(undefined, formData);
        if (state?.error) {
          setError(state.error);
          playLoginAudio("ui.error");
        }
      } catch (err) {
        const digest = (err as { digest?: unknown } | null)?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <div className="login-form rw">
      <StepBar current={phase} />

      {phase === "role" && (
        <div className="rw-phase">
          <h4 className="rw-title">¿Cómo vas a participar?</h4>
          <p className="rw-sub">Elige tu rol para empezar. Podrás personalizar tu avatar después.</p>
          <div className="rw-roles">
            <button
              type="button"
              className="rw-role"
              onClick={() => selectRole("player")}
              onPointerEnter={hover}
            >
              <span className="rw-role__icon" aria-hidden="true">⚽</span>
              <span className="rw-role__name">Jugador</span>
              <span className="rw-role__desc">Únete con el código de tu equipo</span>
            </button>
            <button
              type="button"
              className="rw-role"
              onClick={() => selectRole("coach")}
              onPointerEnter={hover}
            >
              <span className="rw-role__icon" aria-hidden="true">🛡️</span>
              <span className="rw-role__name">Entrenador</span>
              <span className="rw-role__desc">Crea tu equipo y dirige</span>
            </button>
          </div>
        </div>
      )}

      {phase === "team" && role === "player" && (
        <div className="rw-phase">
          <h4 className="rw-title">Código de tu equipo</h4>
          <p className="rw-sub">Paso 2 · Inscríbete con el código que te compartió tu entrenador.</p>
          <div className="field-group">
            <label htmlFor="teamCode">Código del club</label>
            <div className="input-shell">
              <span className="input-shell__icon"><UserIcon /></span>
              <input
                id="teamCode"
                value={teamCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="A1B2C3D4"
                maxLength={8}
                autoComplete="off"
                inputMode="text"
                className="rw-code"
              />
            </div>
          </div>

          {checking && <p className="rw-note">Validando código…</p>}

          {teamValidation && !checking && (
            teamValidation.valid && teamValidation.team ? (
              <div className="rw-team">
                <div className="rw-team__logo">
                  {teamValidation.team.logoUrl ? (
                    <img src={teamValidation.team.logoUrl} alt={teamValidation.team.name} />
                  ) : (
                    <span aria-hidden="true">🛡️</span>
                  )}
                </div>
                <div>
                  <p className="rw-team__name">{teamValidation.team.name}</p>
                  <p className="rw-team__meta">
                    {teamValidation.team.memberCount} miembro(s) · {teamValidation.team.code}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rw-error">{teamValidation.error}</p>
            )
          )}

          <div className="rw-actions">
            <button type="button" className="login-submit login-submit--ghost" onClick={() => go("role")} onPointerEnter={hover}>
              <span>Atrás</span>
            </button>
            <button
              type="button"
              className="login-submit"
              onClick={goToAvatar}
              disabled={!teamValidation?.valid}
              onPointerEnter={hover}
            >
              <span>Continuar</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}

      {phase === "team" && role === "coach" && (
        <div className="rw-phase">
          <h4 className="rw-title">Crea tu equipo</h4>
          <p className="rw-sub">Paso 1 · Entrenador. Ponle nombre y sube su logo institucional.</p>

          <div className="field-group">
            <label htmlFor="teamName">Nombre del equipo</label>
            <div className="input-shell">
              <span className="input-shell__icon"><UserIcon /></span>
              <input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ej: Forjadores Pro"
                maxLength={40}
              />
            </div>
          </div>

          <div className="field-group">
            <label>Logo del equipo</label>
            <div className="rw-upload">
              <button
                type="button"
                className="rw-upload__box"
                onClick={() => fileRef.current?.click()}
                onPointerEnter={hover}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo del equipo" />
                ) : (
                  <span aria-hidden="true">+</span>
                )}
              </button>
              <div className="rw-upload__info">
                <p>{logoPreview ? "Logo seleccionado" : "Toca para subir el logo"}</p>
                <small>PNG, JPG o WebP · máx 5MB</small>
                {uploading && <small className="rw-note">Subiendo…</small>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  void handleLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="rw-actions">
            <button type="button" className="login-submit login-submit--ghost" onClick={() => go("role")} onPointerEnter={hover}>
              <span>Atrás</span>
            </button>
            <button
              type="button"
              className="login-submit"
              onClick={goToAvatar}
              disabled={teamName.trim().length < 2 || uploading}
              onPointerEnter={hover}
            >
              <span>Continuar</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}

      {phase === "avatar" && role && (
        <div className="rw-phase rw-phase--wide">
          <h4 className="rw-title">Tu avatar 3D</h4>
          <p className="rw-sub">
            {role === "player" ? "Paso 3 · " : "Paso 2 · "}
            Género, pelo, piel, uniforme y detalles de fútbol.
          </p>
          <AvatarCreator3D
            value={avatar}
            onChange={setAvatar}
            name={name || username}
            roomName={role === "coach" ? "coaches_lobby" : "players_lobby"}
            onContinue={() => go("account")}
          />
          <div className="rw-actions rw-actions--single">
            <button type="button" className="login-submit login-submit--ghost" onClick={() => go("team")} onPointerEnter={hover}>
              <span>Atrás</span>
            </button>
          </div>
        </div>
      )}

      {phase === "account" && (
        <div className="rw-phase">
          <h4 className="rw-title">Tus datos</h4>
          <p className="rw-sub">Paso 4 · Crea tu cuenta de acceso.</p>

          <div className="field-group">
            <label htmlFor="name">Nombre</label>
            <div className="input-shell">
              <span className="input-shell__icon"><UserIcon /></span>
              <input id="name" type="text" autoComplete="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="username">Usuario</label>
            <div className="input-shell">
              <span className="input-shell__icon"><UserIcon /></span>
              <input id="username" type="text" autoComplete="username" placeholder="Usuario (ej: crack10)" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-shell">
              <span className="input-shell__icon"><MailIcon /></span>
              <input id="email" type="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-shell">
              <span className="input-shell__icon"><LockIcon /></span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="rw-actions">
            <button type="button" className="login-submit login-submit--ghost" onClick={() => go("avatar")} onPointerEnter={hover}>
              <span>Atrás</span>
            </button>
            <button type="button" className="login-submit" onClick={goToConsent} onPointerEnter={hover}>
              <span>Continuar</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}

      {phase === "consent" && (
        <div className="rw-phase">
          <h4 className="rw-title">Consentimiento</h4>
          <p className="rw-sub">Paso 5 · Revisa y acepta para finalizar.</p>

          <label className="rw-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Acepto los términos y la política de privacidad, y el tratamiento de mis datos para
              usar 11Cracks. Si soy menor de edad, cuento con la autorización de mi acudiente.
            </span>
          </label>

          <div className="rw-actions">
            <button type="button" className="login-submit login-submit--ghost" onClick={() => go("account")} onPointerEnter={hover}>
              <span>Atrás</span>
            </button>
            <button type="button" className="login-submit" onClick={finalize} disabled={pending} onPointerEnter={hover}>
              <span>{pending ? "Creando cuenta" : "Finalizar"}</span>
              {pending ? <span className="login-spinner" aria-hidden="true" /> : <ArrowIcon />}
            </button>
          </div>
        </div>
      )}

      {error && <p className="rw-error rw-error--block">{error}</p>}
    </div>
  );
}
