import { requireUser } from "@/lib/auth";
import { EntrenamientoView } from "@/components/admin/sections/entrenamiento-view";

export const metadata = { title: "Entrenamiento" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <EntrenamientoView />
    </div>
  );
}