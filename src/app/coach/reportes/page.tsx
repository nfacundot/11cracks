import { requireSection } from "@/lib/auth";
import { CampusView } from "@/components/admin/sections/campus-view";

export const metadata = { title: "Reportes | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <CampusView />
    </div>
  );
}