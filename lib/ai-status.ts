import type { SavedItem } from "@/types/database";

const STALE_PROCESSING_MS = 2 * 60_000;

/**
 * Defensive fallback for the "stuck on processing forever" bug (see
 * DECISIONS.md, lib/ai/index.ts): if a row has sat at ai_status =
 * 'processing' for longer than this, treat it as failed in the UI even
 * though the DB row itself hasn't been corrected — triggerEnrichment
 * touches updated_at the moment it sets 'processing', so staleness is
 * measurable. This can't retroactively fix historical bad data by
 * itself, but it means an already-stuck item self-heals visually (shows
 * "AI organizing unavailable right now" + a working Re-analyze button)
 * without needing a manual DB fix.
 */
export function isEffectivelyFailed(item: Pick<SavedItem, "ai_status" | "updated_at">): boolean {
  if (item.ai_status === "failed") return true;
  if (item.ai_status !== "processing") return false;
  return Date.now() - new Date(item.updated_at).getTime() > STALE_PROCESSING_MS;
}

/** True only while genuinely in flight — used to decide whether to show the shimmer. */
export function isActivelyProcessing(item: Pick<SavedItem, "ai_status" | "updated_at">): boolean {
  if (item.ai_status === "pending") return true;
  if (item.ai_status !== "processing") return false;
  return Date.now() - new Date(item.updated_at).getTime() <= STALE_PROCESSING_MS;
}
