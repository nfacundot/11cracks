import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Sistema | Superadmin" };

export default async function Page() {
  const user = await requireSection("SUPERADMIN");
  return <GlobalSection user={user} title="Sistema" subtitle="Estado y configuración técnica." />;
}
