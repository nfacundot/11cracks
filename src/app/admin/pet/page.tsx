import { requireSection } from "@/lib/auth";
import { getPetWorkspace } from "@/lib/pet/service";
import { PetWorkspace } from "@/components/admin/pet-workspace";

export const metadata = { title: "PET | Admin" };

export default async function DemoPetPage() {
  const user = await requireSection("ADMIN");
  const view = await getPetWorkspace(user);
  return <PetWorkspace view={view} />;
}