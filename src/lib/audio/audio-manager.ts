"use client";

export type LoginAudioEvent =
  | "ui.hover"
  | "ui.press"
  | "ui.confirm"
  | "ui.error"
  | "ui.energyTrace"
  | "login.ambient";

const AUDIO_SOURCES: Record<LoginAudioEvent, string> = {
  "ui.hover": "/audio/ui/ui-hover-01.wav",
  "ui.press": "/audio/ui/ui-press-01.wav",
  "ui.confirm": "/audio/ui/ui-confirm-01.wav",
  "ui.error": "/audio/ui/ui-error-01.wav",
  "ui.energyTrace": "/audio/ui/ui-energy-trace-01.wav",
  "login.ambient": "/audio/login/login-01.mp3",
};

const AUDIO_VOLUMES: Record<LoginAudioEvent, number> = {
  "ui.hover": 0.07,
  "ui.press": 0.12,
  "ui.confirm": 0.17,
  "ui.error": 0.16,
  "ui.energyTrace": 0.1,
  "login.ambient": 0.14,
};

class AudioManager {
  private readonly cache = new Map<LoginAudioEvent, HTMLAudioElement>();
  private unlocked = false;
  private ambientAttempted = false;
  private ambientStarted = false;
  private lastHoverAt = 0;

  preload() {
    if (typeof window === "undefined") return;
    for (const event of Object.keys(AUDIO_SOURCES) as LoginAudioEvent[]) this.get(event);
  }

  unlock() {
    if (typeof window === "undefined") return;
    this.preload();
    this.unlocked = true;
    this.startAmbient();
  }

  startAmbient() {
    if (typeof window === "undefined" || this.ambientStarted || this.ambientAttempted) return;
    this.ambientAttempted = true;
    const ambient = this.get("login.ambient");
    if (!ambient) return;
    void ambient
      .play()
      .then(() => {
        this.ambientStarted = true;
      })
      .catch(() => {
        this.ambientAttempted = false;
      });
  }

  play(event: LoginAudioEvent) {
    if (typeof window === "undefined" || !this.unlocked) return;
    if (event === "ui.hover") {
      const now = performance.now();
      if (now - this.lastHoverAt < 180) return;
      this.lastHoverAt = now;
    }

    const audio = this.get(event);
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = AUDIO_VOLUMES[event];
    void audio.play().catch(() => undefined);
  }

  private get(event: LoginAudioEvent) {
    const existing = this.cache.get(event);
    if (existing) return existing;
    const audio = new Audio(AUDIO_SOURCES[event]);
    audio.preload = "auto";
    audio.volume = AUDIO_VOLUMES[event];
    this.cache.set(event, audio);
    return audio;
  }
}

export const loginAudioManager = new AudioManager();

export function preloadLoginAudio() {
  loginAudioManager.preload();
}

export function unlockLoginAudio() {
  loginAudioManager.unlock();
}

export function startLoginAmbient() {
  loginAudioManager.startAmbient();
}

export function playLoginAudio(event: LoginAudioEvent) {
  loginAudioManager.play(event);
}
