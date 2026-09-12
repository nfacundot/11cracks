export type VideoEmbedProvider = "youtube" | "vimeo";

export type ResolvedVideoSource =
  | { kind: "file"; url: string }
  | { kind: "embed"; provider: VideoEmbedProvider; embedUrl: string; videoId: string };

function youtubeVideoId(raw: URL): string | null {
  const host = raw.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return raw.pathname.slice(1).split("/")[0] || null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const fromQuery = raw.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const parts = raw.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
      return parts[1] ?? null;
    }
  }
  return null;
}

function vimeoVideoId(raw: URL): string | null {
  const host = raw.hostname.replace(/^www\./, "");
  if (!host.endsWith("vimeo.com")) return null;
  for (const part of raw.pathname.split("/").filter(Boolean)) {
    if (/^\d+$/.test(part)) return part;
  }
  return null;
}

export function resolveVideoSource(rawUrl: string | null | undefined): ResolvedVideoSource | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const youtubeId = youtubeVideoId(parsed);
    if (youtubeId) {
      return {
        kind: "embed",
        provider: "youtube",
        videoId: youtubeId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      };
    }
    const vimeoId = vimeoVideoId(parsed);
    if (vimeoId) {
      return {
        kind: "embed",
        provider: "vimeo",
        videoId: vimeoId,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      };
    }
  } catch {
    // URL relativa o inválida: se trata como archivo.
  }

  return { kind: "file", url };
}