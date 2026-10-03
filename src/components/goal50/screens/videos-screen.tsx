"use client";

import { useEffect, useState } from "react";
import { PlayerVideos } from "@/components/player/player-videos";
import type { PlayerVideoView } from "@/lib/videos/service";

export default function VideosScreen() {
  const [videos, setVideos] = useState<PlayerVideoView[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/videos", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { videos: PlayerVideoView[] }) => {
        if (active) setVideos(data.videos);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">No se pudieron cargar los videos.</div>;
  }
  if (!videos) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Cargando videos…</div>;
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <PlayerVideos videos={videos} />
    </div>
  );
}
