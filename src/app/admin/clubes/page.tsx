import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { ClubesView } from "@/components/admin/sections/clubes-view";

export const metadata = { title: "Clubes | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Clubes"
      subtitle="Clubes de tu organización."
      basePath="/admin"
      roleText="Administrador"
    >
      <ClubesView />
    </GlobalSection>
  );
}
