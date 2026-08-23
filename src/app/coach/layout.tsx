import { CleanUrl } from "@/components/admin/clean-url";
import { requireSection } from "@/lib/auth";
import { CoachShell } from "@/components/admin/coach-shell";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSection("ENTRENADOR");

  return (
    <>
      <CleanUrl base="/coach" />
      <CoachShell user={user}>{children}</CoachShell>
    </>
  );
}