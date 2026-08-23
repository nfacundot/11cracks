import { requireSection } from "@/lib/auth";
import { StaffShell } from "@/components/admin/staff-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("ADMIN");

  return (
    <StaffShell
      basePath="/admin"
      title="11Cracks Admin"
      subtitle="Panel de administración"
      user={user}
    >
      {children}
    </StaffShell>
  );
}
