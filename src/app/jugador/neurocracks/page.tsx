import { requireUser } from "@/lib/auth";
import { NeurocracksView } from "@/components/admin/sections/neurocracks-view";

export const metadata = { title: "NeuroCracks" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <NeurocracksView />
    </div>
  );
}