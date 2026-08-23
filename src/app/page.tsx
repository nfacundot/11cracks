import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { AuthTabs } from "@/components/auth-tabs";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect(homeForRole(user.role));
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-end px-6 text-zinc-900 dark:text-zinc-100">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat max-md:hidden"
        style={{ backgroundImage: "url(/img/emotes/backlogPC.png)" }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: "url(/img/emotes/backlogMOB.png)" }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl" style={{ transform: "perspective(800px) rotateY(-2deg) rotateX(1deg)" }}>
          <AuthTabs />
        </div>
      </div>
    </div>
  );
}
