import { requireUser } from "@/lib/auth";
import { PlayerVideos } from "@/components/player/player-videos";

export const metadata = { title: "Videos · 11Cracks" };

export default async function VideosPage() {
  await requireUser();
  return <PlayerVideos />;
}