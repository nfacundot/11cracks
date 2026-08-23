import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Sistema | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Sistema"
      subtitle="Estado y configuración técnica."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
