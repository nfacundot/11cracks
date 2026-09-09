import { requireSection } from "@/lib/auth";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireSection("ADMIN");
  return <>{children}</>;
}
