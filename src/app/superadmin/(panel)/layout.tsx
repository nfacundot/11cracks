import { requireSection } from "@/lib/auth";
import { StaffShell } from "@/components/admin/staff-shell";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("SUPERADMIN");

  return (
    <StaffShell
      basePath="/superadmin"
      title="11Cracks Superadmin"
      subtitle="Panel de superadministración"
      user={user}
    >
      {children}
    </StaffShell>
  );
}
