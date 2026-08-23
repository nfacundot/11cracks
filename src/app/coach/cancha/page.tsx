import { requireSection } from "@/lib/auth";
import { CanchaView } from "@/components/admin/sections/cancha-view";

export const metadata = { title: "Cancha | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <CanchaView />
    </div>
  );
}