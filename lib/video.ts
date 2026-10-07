export interface VideoEmbed {
  kind: "iframe" | "native";
  src: string;
  /** Vertical content (Shorts/Reels) gets a portrait box instead of 16:9 — never crop a Reel into a landscape frame. */
  orientation: "landscape" | "portrait";
}

export function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? null;
}

/**
 * Detects a playable inline preview for a saved item, if one exists.
 * Returns null for anything that isn't actually playable — articles,
 * repos, plain images, AND, deliberately, Instagram/TikTok. Those
 * platforms don't offer a public, unauthenticated way to embed a
 * specific video (Instagram's oEmbed requires a Meta app token;
 * TikTok's requires their embed script + async handshake) — attempting
 * a plain <iframe src="instagram.com/..."> just shows a blank frame or a
 * login wall. Rather than fake a broken preview, those fall back to
 * their static thumbnail (Section 4: never show something that looks
 * broken).
 */
export function getVideoEmbed(item: {
  url: string | null;
  content_type: string | null;
}): VideoEmbed | null {
  if (item.content_type !== "video" || !item.url) return null;
  const url = item.url;

  const isVertical = /\/shorts\/|instagram\.com\/reel|tiktok\.com/i.test(url);
  const orientation: VideoEmbed["orientation"] = isVertical ? "portrait" : "landscape";

  const ytId = extractYoutubeId(url);
  if (ytId) {
    return {
      kind: "iframe",
      orientation,
      src: `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&playsinline=1`,
    };
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      kind: "iframe",
      orientation,
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`,
    };
  }

  // A direct video file — either something the user uploaded, or a link
  // that happens to point straight at a .mp4/.webm. We control this one
  // fully, so MediaPreview measures its real dimensions instead of
  // guessing an orientation.
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
    return { kind: "native", orientation, src: url };
  }

  return null;
}
