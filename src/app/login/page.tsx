import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { LoginAudioController } from "@/components/login/login-audio-controller";
import { LoginGate } from "@/components/login/login-gate";

export const metadata: Metadata = {
  title: "Acceso",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(homeForRole(user.role));
  }

  return (
    <main className="login-page">
      <LoginGate />
      <LoginAudioController />
    </main>
  );
}
