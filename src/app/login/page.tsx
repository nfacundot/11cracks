import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { loginScenePool, selectLoginScene } from "@/lib/login/scenes";
import { LoginAudioController } from "@/components/login/login-audio-controller";
import { LoginScene } from "@/components/login/login-scene";
import { AuthTabs } from "@/components/auth-tabs";

export const metadata: Metadata = {
  title: "Acceso",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(homeForRole(user.role));
  }

  const initialScene = selectLoginScene();

  return (
    <main className="login-page">
      <LoginScene initialScene={initialScene} pool={loginScenePool} />
      <LoginAudioController />

      <div className="login-frame">
        <div className="login-auth-unit">
          <section className="login-content login-panel" aria-labelledby="login-heading">
            <div className="login-panel__surface">
              <span className="login-panel__bracket login-panel__bracket--top" aria-hidden="true" />
              <span className="login-panel__bracket login-panel__bracket--bottom" aria-hidden="true" />
              <span className="login-panel__corner login-panel__corner--top-left" aria-hidden="true" />
              <span className="login-panel__corner login-panel__corner--bottom-right" aria-hidden="true" />

              <span className="login-energy-trace" aria-hidden="true" />

              <div className="login-brand-row">
                <div className="login-intro">
                  <h1 id="login-heading">
                    <span>Entra en</span>
                    <span>tu mundo</span>
                  </h1>
                  <p>Tu próximo paso empieza aquí.</p>
                </div>
                <div className="login-brand login-brand--inline">
                  <Image
                    src="/brand/11-cracks.svg"
                    alt="11 Cracks"
                    width={401}
                    height={114}
                    priority
                  />
                  <span className="login-brand__signal" aria-hidden="true" />
                </div>
              </div>

              <AuthTabs />
            </div>
          </section>
        </div>

        <footer className="login-footer">
          <span>11 Cracks</span>
          <span className="login-footer__separator" aria-hidden="true" />
          <span>Educación, deporte y futuro</span>
        </footer>
      </div>
    </main>
  );
}
