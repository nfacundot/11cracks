import { requireSection } from "@/lib/auth";
import { getCorrectionsWorkspace } from "@/lib/corrections/service";
import { CorrectionsWorkspace } from "@/components/admin/corrections-workspace";

export const metadata = { title: "Correcciones | Admin" };

export default async function CorrectionsPage() {
  const user = await requireSection("ADMIN");
  const view = await getCorrectionsWorkspace(user);
  return <CorrectionsWorkspace view={view} />;
}