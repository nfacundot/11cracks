import { requireSection } from "@/lib/auth";
import { MiPerfilView } from "@/components/admin/sections/mi-perfil-view";

export const metadata = { title: "Perfil | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");
  return (
    <div className="space-y-6">
      <MiPerfilView
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          position: user.position,
          favoriteTeam: user.favoriteTeam,
          country: user.country,
        }}
      />
    </div>
  );
}