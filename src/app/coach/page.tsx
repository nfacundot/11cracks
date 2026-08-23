import { requireSection } from "@/lib/auth";
import { CoachDashboardView } from "@/components/admin/sections/coach-dashboard-view";

export const metadata = { title: "Inicio | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <CoachDashboardView />
    </div>
  );
}