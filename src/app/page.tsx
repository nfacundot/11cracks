import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { BallLogo } from "@/components/ball-logo";
import {
  GamepadIcon,
  ShieldIcon,
  BallIcon,
} from "@/components/icons";

const features = [
  { icon: <BallIcon className="h-6 w-6" />, title: "Lecciones" },
  { icon: <GamepadIcon className="h-6 w-6" />, title: "Juegos" },
  { icon: <ShieldIcon className="h-6 w-6" />, title: "Rachas" },
  { icon: <ShieldIcon className="h-6 w-6" />, title: "Equipos" },
];

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/learn");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden bg-emerald-950 text-white">
      <section className="flex flex-col items-center gap-3 px-6 pb-6 pt-10 text-center">
        <div className="animate-float">
          <BallLogo size={96} src="/img/icons/favicon.png" />
        </div>
        <p className="max-w-xs text-green-100/80">
          App Futbolística para todas las Edades
        </p>
      </section>

      <section className="flex flex-1 flex-col rounded-t-3xl bg-white/60 backdrop-blur-xl px-6 pb-6 pt-6 text-zinc-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-100">
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50/50 p-3 dark:border-green-900 dark:bg-emerald-900/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
                {f.icon}
              </div>
              <h2 className="font-black">{f.title}</h2>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-green-500 py-4 text-center text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Empieza gratis
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border-2 border-green-200 py-3.5 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>
    </div>
  );
}
