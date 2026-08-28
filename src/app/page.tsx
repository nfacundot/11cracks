import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect(homeForRole(user.role));
  }
  redirect("/login");
}
