import { requireUser } from "@/lib/auth";
import { BilleteraSolidariaView } from "@/components/admin/sections/billetera-solidaria-view";

export const metadata = { title: "Billetera Solidaria" };

export default async function Page() {
  await requireUser();
  return (
    <div className="space-y-6">
      <BilleteraSolidariaView />
    </div>
  );
}