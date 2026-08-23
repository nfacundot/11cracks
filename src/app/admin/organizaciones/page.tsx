import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";

export const metadata = { title: "Organizaciones | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Organizaciones"
      subtitle="Organizaciones y su estado global."
      basePath="/admin"
      roleText="Administrador"
    />
  );
}
