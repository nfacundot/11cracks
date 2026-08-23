import { redirect } from "next/navigation";

export const metadata = { title: "Vista Global | Superadmin" };

export default function SuperadminIndexPage() {
  redirect("/superadmin/dashboard");
}
