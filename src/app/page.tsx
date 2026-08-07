import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  FlameIcon,
  GamepadIcon,
  DumbbellIcon,
  ShieldIcon,
  BallIcon,
} from "@/components/icons";

const features = [
  {
    icon: <BallIcon className="h-6 w-6" />,
    title: "Lecciones cortas",
    desc: "Aprende fútbol con preguntas y retos diarios, como Duolingo.",
  },
  {
    icon: <GamepadIcon className="h-6 w-6" />,
    title: "Juegos interactivos",
    desc: "Penales, memoria y sprints para entrenar tu mente.",
  },
  {
    icon: <FlameIcon className="h-6 w-6" />,
    title: "Rachas diarias",
    desc: "No rompas tu racha. Constancia = XP y nivel.",
  },
  {
    icon: <ShieldIcon className="h-6 w-6" />,
    title: "Equipos",
    desc: "Crea tu equipo, invita amigos y entrena juntos.",
  },
];

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-emerald-950 text-white">
      <section className="flex flex-col items-center gap-4 px-6 pb-10 pt-14 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-6xl shadow-2xl shadow-green-900/50">
          ⚽
        </div>
        <h1 className="text-4xl font-black tracking-tight">
          11<span className="text-green-400">Cracks</span>
        </h1>
        <p className="max-w-xs text-green-100/80">
          La app de fútbol estilo Duolingo. Lecciones, juegos, rachas y equipos.
        </p>
      </section>

      <section className="flex-1 rounded-t-3xl bg-white px-6 pb-10 pt-8 text-zinc-900">
        <div className="grid grid-cols-1 gap-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
                {f.icon}
              </div>
              <div>
                <h2 className="font-black">{f.title}</h2>
                <p className="text-sm text-zinc-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-green-500 py-4 text-center text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Empieza gratis
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border-2 border-green-200 py-3.5 text-center font-bold text-green-700 transition hover:bg-green-50"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1 text-center text-xs text-zinc-400">
          <DumbbellIcon className="h-3.5 w-3.5" />
          Entrena tu mente futbolera todos los días
        </p>
      </section>
    </div>
  );
}
