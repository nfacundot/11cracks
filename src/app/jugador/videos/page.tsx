import { requireUser } from "@/lib/auth";
import { getPlayerVideosWorkspace } from "@/lib/videos/service";
import { PlayerVideos } from "@/components/player/player-videos";

export const metadata = { title: "Videos · 11Cracks" };

export default async function PlayerVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const videos = await getPlayerVideosWorkspace(user.id);
  const { filter } = await searchParams;
  return <PlayerVideos videos={videos} initialFilter={filter} />;
}