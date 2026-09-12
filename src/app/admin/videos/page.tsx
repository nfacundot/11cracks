import { requireSection } from "@/lib/auth";
import { getVideosAdminWorkspace } from "@/lib/videos/service";
import { VideosWorkspace } from "@/components/admin/videos-workspace";

export const metadata = { title: "Videos | Admin" };

export default async function AdminVideosPage() {
  await requireSection("ADMIN");
  const view = await getVideosAdminWorkspace();
  return <VideosWorkspace view={view} />;
}