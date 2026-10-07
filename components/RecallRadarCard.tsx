"use client";

import { GlassPanel } from "@/components/GlassPanel";
import { ContentTypeGlyph } from "@/components/Badges";
import type { SavedItem } from "@/types/database";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import Link from "next/link";

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Recall Radar — see lib/db/saved-items.ts (getRadarPick) for the
 * reasoning. This is the one place in the app that proactively
 * resurfaces something instead of waiting to be searched for.
 */
export function RecallRadarCard({ item }: { item: SavedItem }) {
  const days = daysAgo(item.saved_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/app/item/${item.id}`} className="block">
        <GlassPanel className="border-accent/25 p-5 transition-shadow hover:shadow-glow">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent-text">
            <Radar size={13} />
            Recall Radar
          </div>
          <p className="mt-1.5 text-sm text-text-secondary">
            Saved {days} days ago — worth another look?
          </p>
          <div className="mt-2 flex items-center gap-2">
            <ContentTypeGlyph contentType={item.content_type} />
            <h3 className="font-display text-lg text-text-primary">
              {item.title || item.url || "Untitled"}
            </h3>
          </div>
          {item.what_was_i_thinking && (
            <p className="mt-2 text-sm italic text-text-secondary">
              &ldquo;{item.what_was_i_thinking}&rdquo;
            </p>
          )}
        </GlassPanel>
      </Link>
    </motion.div>
  );
}
