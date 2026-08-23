import { requireUser } from "@/lib/auth";
import { MiPerfilView } from "@/components/admin/sections/mi-perfil-view";

export const metadata = { title: "Mi perfil" };

export default async function Page() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <MiPerfilView user={{ name: user.name, email: user.email, role: user.role }} />
    </div>
  );
}