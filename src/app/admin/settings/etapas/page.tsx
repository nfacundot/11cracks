import Link from "next/link";
import { requireSection } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { EtapasView } from "@/components/admin/sections/etapas-view";

export const metadata = { title: "Configurador de etapas | Admin" };

export default async function SettingsEtapasPage() {
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
          Configurador de Etapas
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Crea y administra las etapas y sus temas, tal como quedaron en versiones anteriores del software.
        </p>
      </div>
      <EtapasView basePath="/admin" />
    </div>
  );
}