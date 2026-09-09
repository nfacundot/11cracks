import { redirect } from "next/navigation";
import { requireSection } from "@/lib/auth";

export const metadata = { title: "Inicio | Admin" };

export default async function AdminDashboardPage() {
  await requireSection("ADMIN");
  redirect("/admin");
}