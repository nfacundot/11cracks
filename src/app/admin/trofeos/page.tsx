import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrophiesManager } from "@/components/admin/sections/trophies-manager";

export const metadata = { title: "Trofeos | Admin" };

export const dynamic = "force-dynamic";

export default async function AdminTrophiesPage() {
  await requireSection("ADMIN");

  const trophies = await prisma.trophy.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Trofeos</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Crea trofeos y define la condición que los desbloquea.
        </p>
      </div>
      <TrophiesManager trophies={trophies} />
    </div>
  );
}
