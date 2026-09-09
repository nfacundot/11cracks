import Link from "next/link";
import { requireSection } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { AsignaturasView } from "@/components/admin/sections/asignaturas-view";

export const metadata = { title: "Configurador de materias | Admin" };

export default async function SettingsMateriasPage() {
  await requireSection("ADMIN");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/settings"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Configuración
      </Link>
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Configurador de Materias
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Crea, edita y asocia las materias del proyecto. Desde cada materia puedes agregarle lecciones.
        </p>
      </div>
      <AsignaturasView />
    </div>
  );
}