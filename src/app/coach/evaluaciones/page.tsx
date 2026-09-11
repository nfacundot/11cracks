import { requireSection } from "@/lib/auth";
import { getEvaluationsWorkspace } from "@/lib/evaluations/service";
import { EvaluacionWorkspace } from "@/components/coach/evaluacion-workspace";

export const metadata = { title: "Evaluaciones | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  const workspace = await getEvaluationsWorkspace(user);
  return (
    <div className="space-y-6">
      <EvaluacionWorkspace workspace={workspace} />
    </div>
  );
}