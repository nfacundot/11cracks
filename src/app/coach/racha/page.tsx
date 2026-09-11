import { requireSection } from "@/lib/auth";
import { getStreakWorkspace } from "@/lib/streak/service";
import { RachaWorkspace } from "@/components/coach/racha-workspace";

export const metadata = { title: "Racha | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  const workspace = await getStreakWorkspace(user);
  return (
    <div className="space-y-6">
      <RachaWorkspace workspace={workspace} />
    </div>
  );
}