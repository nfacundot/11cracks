import { requireSection } from "@/lib/auth";
import { getAttendanceWorkspace } from "@/lib/attendance/service";
import { AsistenciaWorkspace } from "@/components/coach/asistencia-workspace";

export const metadata = { title: "Asistencia | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  const workspace = await getAttendanceWorkspace(user);
  return (
    <div className="space-y-6">
      <AsistenciaWorkspace workspace={workspace} />
    </div>
  );
}