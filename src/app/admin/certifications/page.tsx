import { requireSection } from "@/lib/auth";
import { getCertificateOperationsView } from "@/lib/certificates/read-model";
import { CertificateWorkspace } from "@/components/admin-demo/certificate-workspace";

export const metadata = { title: "Certificaciones | Admin" };

export default async function CertificationsPage() {
  await requireSection("ADMIN");
  const view = await getCertificateOperationsView();
  return <CertificateWorkspace view={view} />;
}