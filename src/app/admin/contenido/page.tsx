import { requireSection } from "@/lib/auth";
import { GlobalSection } from "@/components/admin/global-section";
import { ContenidoView } from "@/components/admin/sections/contenido-view";

export const metadata = { title: "Contenido | Admin" };

export default async function Page() {
  const user = await requireSection("ADMIN");
  return (
    <GlobalSection
      user={user}
      title="Contenido"
      subtitle="Clases, juegos y recursos de aprendizaje."
      basePath="/admin"
      roleText="Administrador"
    >
      <ContenidoView />
    </GlobalSection>
  );
}
