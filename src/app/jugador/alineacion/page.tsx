import { requireUser } from "@/lib/auth";
import { AlineacionView } from "@/components/admin/sections/alineacion-view";

export const metadata = { title: "Alineación" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <AlineacionView />
    </div>
  );
}