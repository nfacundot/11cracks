import { requireUser } from "@/lib/auth";
import { LogrosView } from "@/components/admin/sections/logros-view";

export const metadata = { title: "Logros" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <LogrosView />
    </div>
  );
}