import { redirect } from "next/navigation";

export const metadata = { title: "Vista Global | Admin" };

export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
