import { requireSection } from "@/lib/auth";
import { getImportWorkspace } from "@/lib/imports/service";
import { ImportWorkspace } from "@/components/admin/import-workspace";

export const metadata = { title: "Importaciones | Admin" };

export default async function ImportPage() {
  const user = await requireSection("ADMIN");
  const view = await getImportWorkspace(user);
  return <ImportWorkspace view={view} />;
}