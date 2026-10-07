"use client";

import { ContentTypeGlyph } from "@/components/Badges";
import { getVideoEmbed } from "@/lib/video";
import { cn } from "@/lib/utils";
import type { SavedItem } from "@/types/database";
import { PlayCircle } from "lucide-react";
import { useRef, useState } from "react";

/**
 * Renders the top-of-card media. Three cases:
 *  - Playable video (YouTube/Vimeo/direct file): shows the static
 *    thumbnail at rest, swaps to a real muted/looping inline preview on
 *    hover — no click-through required just to see what it is.
 *  - Plain image (OG thumbnail or an uploaded image): rendered at its
 *    own natural aspect ratio (no fixed box, no object-cover crop).
 *  - Nothing playable/visual: a glyph placeholder.
 *
 * Vertical content (Shorts/Reels) gets a portrait box instead of being
 * squeezed into a 16:9 frame — a plain bookmarking tool would just crop
 * the top and bottom off; this doesn't.
 */
export function MediaPreview({ item }: { item: SavedItem }) {
  const [hovering, setHovering] = useState(false);
  const [nativeRatio, setNativeRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const embed = getVideoEmbed(item);

  if (embed) {
    const aspectStyle =
      embed.kind === "native" && nativeRatio
        ? { aspectRatio: nativeRatio }
        : embed.orientation === "portrait"
          ? { aspectRatio: "9 / 16" }
          : { aspectRatio: "16 / 9" };

    return (
      <div
        className="relative mb-3 w-full overflow-hidden rounded-md bg-bg-1"
        style={aspectStyle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {item.thumbnail_url && (
          <img
            src={item.thumbnail_url}
            alt=""
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              hovering ? "opacity-0" : "opacity-100",
            )}
          />
        )}

        {!item.thumbnail_url && !hovering && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-2 to-bg-1">
            <PlayCircle size={28} className="text-text-muted" />
          </div>
        )}

        {hovering &&
          (embed.kind === "iframe" ? (
            <iframe
              src={embed.src}
              className="pointer-events-none absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media"
              frameBorder={0}
              title="Video preview"
            />
          ) : (
            <video
              ref={videoRef}
              src={embed.src}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setNativeRatio(v.videoWidth / v.videoHeight);
              }}
            />
          ))}

        <div className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-bg-0/70 px-1.5 py-0.5 text-[10px] text-text-secondary backdrop-blur">
          {hovering ? "Playing preview" : "Hover to preview"}
        </div>
      </div>
    );
  }

  if (item.thumbnail_url) {
    return (
      <div className="mb-3 w-full overflow-hidden rounded-md bg-bg-1">
        {/* Plain <img>, not next/image with `fill` — lets the image's own
            intrinsic dimensions set the box height, so nothing gets
            cropped to fit a preset ratio. */}
        <img src={item.thumbnail_url} alt="" className="h-auto w-full" loading="lazy" />
      </div>
    );
  }

  return (
    <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-md border border-border bg-gradient-to-br from-bg-2 to-bg-1">
      <ContentTypeGlyph contentType={item.content_type} />
    </div>
  );
}
