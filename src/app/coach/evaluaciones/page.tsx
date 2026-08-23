import { requireSection } from "@/lib/auth";
import { EvaluacionesView } from "@/components/admin/sections/evaluaciones-view";

export const metadata = { title: "Evaluaciones | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <EvaluacionesView />
    </div>
  );
}