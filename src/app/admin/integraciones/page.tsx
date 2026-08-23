import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Integraciones | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Integraciones"
      subtitle="Servicios conectados a la plataforma."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
