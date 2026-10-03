import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SponsorsManager } from "@/components/admin/sections/sponsors-manager";

export const metadata = { title: "Patrocinadores | Admin" };

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  await requireSection("ADMIN");

  const sponsors = await prisma.sponsor.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Patrocinadores</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hasta 20 logos que rotan en las vallas publicitarias del estadio.
        </p>
      </div>
      <SponsorsManager sponsors={sponsors} />
    </div>
  );
}
