import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { triggerEnrichment } from "@/lib/ai";
import { waitUntil } from "@vercel/functions";
import {
  fetchUrlMetadata,
  guessContentTypeFromHostname,
  getYoutubeThumbnail,
} from "@/lib/metadata";
import type { CreateSavedItemInput, UpdateSavedItemInput } from "@/lib/validation/saved-item";
import type { SavedItem } from "@/types/database";

/**
 * Creates a saved item. For URL saves, fetches metadata server-side
 * first (Section 5) but never lets a slow/failed fetch block the save —
 * on any metadata failure the item is still inserted with just the raw
 * URL, per Section 4's "saving must be fast, never blocked" rule.
 */
export async function createSavedItem(
  userId: string,
  input: CreateSavedItemInput,
): Promise<{ item: SavedItem | null; error: string | null }> {
  const supabase = createClient();

  let row: Record<string, unknown>;

  if (input.input_type === "url") {
    // IMPORTANT: do not await the page scrape here. Insert immediately
    // with only cheap, synchronous, no-network best-guesses (hostname
    // pattern-matching + YouTube's static thumbnail CDN), then scrape
    // the real page in the background and patch the row once it
    // resolves. Previously this awaited fetchUrlMetadata (up to a 6s
    // timeout) before responding at all — every link save paid that
    // full latency even though Section 5 explicitly requires saving to
    // never block. Library/Item Detail already re-fetch fresh from the
    // DB on every visit, so the enriched title/thumbnail just appears
    // next time the page is viewed — no polling needed.
    const hostname = safeHostname(input.url);
    const contentType = guessContentTypeFromHostname(hostname);
    row = {
      user_id: userId,
      input_type: "url",
      url: input.url,
      title: null,
      description: null,
      thumbnail_url: contentType === "video" ? getYoutubeThumbnail(input.url) : null,
      favicon_url: null,
      source_domain: hostname,
      content_type: contentType,
    };
  } else if (input.input_type === "note") {
    row = {
      user_id: userId,
      input_type: "note",
      title: input.title,
      description: input.description ?? null,
      content_type: "note",
    };
  } else {
    // image | file — already uploaded to Storage by the client. Client
    // passes content_type: 'video' when the uploaded file is actually a
    // video, so it gets the same hover-preview treatment as a saved
    // video link (see lib/video.ts / MediaPreview).
    row = {
      user_id: userId,
      input_type: input.input_type,
      storage_path: input.storage_path,
      title: input.title ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      url: input.url ?? null,
      content_type: input.content_type ?? input.input_type,
      content_text: input.content_text ?? null,
    };
  }

  const { data, error } = await supabase.from("saved_items").insert(row).select().single();

  if (error) return { item: null, error: error.message };
  const item = data as SavedItem;

  if (input.input_type === "url") {
    // waitUntil (@vercel/functions — no-ops safely off Vercel) keeps this
    // running after the response is sent. A bare `void` risked the
    // function being frozen mid-work the instant the response went out
    // on serverless — this is the Phase 21 fix for that.
    waitUntil(enrichUrlMetadataInBackground(item.id, input.url));
  }

  return { item, error: null };
}

async function enrichUrlMetadataInBackground(itemId: string, url: string): Promise<void> {
  // Service-role client (lib/supabase/service.ts), not the cookie-based
  // one — this function's whole job is to run after real network I/O
  // (the fetch below), well outside the original request's lifecycle,
  // and the earlier cookie-based approach here turned out to be exactly
  // the kind of fragility that left AI enrichment stuck on "processing"
  // elsewhere (see lib/ai/index.ts, DECISIONS.md). The item id is
  // already known and owned by the user who created it; no need to
  // re-derive identity from a possibly-stale cookie jar for an
  // update-by-known-id.
  const supabase = createServiceClient();
  try {
    const metadata = await fetchUrlMetadata(url);
    if (!metadata) return;

    const patch: Record<string, unknown> = {};
    if (metadata.title) patch.title = metadata.title;
    if (metadata.description) patch.description = metadata.description;
    if (metadata.thumbnail_url) patch.thumbnail_url = metadata.thumbnail_url;
    if (metadata.favicon_url) patch.favicon_url = metadata.favicon_url;
    if (metadata.content_type) patch.content_type = metadata.content_type;
    if (metadata.media_url) patch.source_media_url = metadata.media_url;
    if (metadata.page_text) patch.content_text = metadata.page_text;
    if (Object.keys(patch).length === 0) return;

    await supabase.from("saved_items").update(patch).eq("id", itemId);
  } catch {
    // Best-effort — the item already saved fine with hostname-based
    // guesses; a failed background scrape just means it stays that way.
  } finally {
    // Runs AI enrichment only after metadata has had its chance to land —
    // whether the scrape above succeeded, found nothing, or errored — so
    // the AI prompt sees the real title/description instead of nulls.
    // Awaited (not `void`) so THIS function's own promise — already
    // wrapped in waitUntil at its call site above — doesn't resolve
    // until enrichment genuinely finishes too; otherwise the outer
    // waitUntil would cover only the metadata scrape, not the AI call
    // nested inside this finally block.
    await triggerEnrichment(itemId);
  }
}

export async function updateSavedItem(
  itemId: string,
  patch: UpdateSavedItemInput,
): Promise<{ item: SavedItem | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();

  if (error) return { item: null, error: error.message };
  return { item: data as SavedItem, error: null };
}

/**
 * Loads all of the current user's saved items for the Library view.
 * No pagination yet (Section 20 handles that in the Performance phase) —
 * fine for v1's typical personal-library size; filtering/sorting on the
 * loaded set happens client-side in LibraryView.
 */
export async function listSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return data as SavedItem[];
}

export async function listSavedItemsByCollection(
  userId: string,
  collectionId: string,
): Promise<SavedItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .eq("collection_id", collectionId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return data as SavedItem[];
}

/** Item count per collection, for the Collections grid. One lightweight
 * query (just the FK column) rather than N queries or loading full rows. */
export async function getCollectionItemCounts(userId: string): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("saved_items")
    .select("collection_id")
    .eq("user_id", userId)
    .not("collection_id", "is", null);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { collection_id: string }[]) {
    counts[row.collection_id] = (counts[row.collection_id] ?? 0) + 1;
  }
  return counts;
}

export async function listSavedItemsByProject(
  userId: string,
  projectId: string,
): Promise<SavedItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return data as SavedItem[];
}

/** Item count per project, for the Projects grid — same shape as the collections version. */
export async function getProjectItemCounts(userId: string): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("saved_items")
    .select("project_id")
    .eq("user_id", userId)
    .not("project_id", "is", null);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { project_id: string }[]) {
    counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * "Lightweight activity feed derived from timestamps" (Section 18) —
 * rather than a separate activity-log table, this just reads saved_at
 * off the project's own items and turns the most recent ones into
 * feed-style lines. Cheap, always accurate (nothing to keep in sync),
 * and grows real teeth once Tasks (Phase 10) add completed_at into the
 * same feed.
 */
export async function getProjectActivity(
  userId: string,
  projectId: string,
  limit = 8,
): Promise<{ item: SavedItem; at: string }[]> {
  const items = await listSavedItemsByProject(userId, projectId);
  return items
    .slice()
    .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())
    .slice(0, limit)
    .map((item) => ({ item, at: item.saved_at }));
}

/**
 * "Recall Radar" — an original feature (not in the master prompt): once
 * a day, the dashboard surfaces one older, still-unrevisited memory
 * instead of only ever showing what's newest. Bookmarking apps are
 * pull-only (you have to remember to go search); this is a small,
 * deliberate push in the opposite direction — the whole point of Recall
 * is resurfacing "why did I save this," so the home screen should
 * occasionally just do that unprompted.
 *
 * The pick is deterministic per user per day (seeded by today's date),
 * not random — so it doesn't reshuffle on every page load, only once a
 * day, and always favors items with an actual "why" note since those
 * make for a more meaningful resurfacing than a bare link.
 */
export async function getRadarPick(userId: string): Promise<SavedItem | null> {
  const supabase = createClient();
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .lt("saved_at", cutoff)
    .order("saved_at", { ascending: true })
    .limit(50);

  const candidates = (data ?? []) as SavedItem[];
  if (candidates.length === 0) return null;

  const withNotes = candidates.filter((i) => i.what_was_i_thinking);
  const pool = withNotes.length > 0 ? withNotes : candidates;

  const seed = new Date().toISOString().slice(0, 10) + userId;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  return pool[hash % pool.length] ?? null;
}

/**
 * "Memory Thread" — an original feature (not in the master prompt): on
 * an item's detail page, shows what else got saved the same day. Two
 * things saved an hour apart usually share context — the same project,
 * the same train of thought, the same late-night research binge — even
 * when they don't share a domain or a collection. Similar Saves (see
 * DECISIONS.md) clusters by source; this clusters by time, which is a
 * genuinely different and complementary signal.
 */
export async function listSameDayItems(
  userId: string,
  itemId: string,
  savedAtIso: string,
): Promise<SavedItem[]> {
  const supabase = createClient();
  const day = new Date(savedAtIso);
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
  const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .neq("id", itemId)
    .gte("saved_at", startOfDay)
    .lt("saved_at", endOfDay)
    .order("saved_at", { ascending: true })
    .limit(12);

  return (data ?? []) as SavedItem[];
}

export interface SavedItemsPage {
  items: SavedItem[];
  /** saved_at of the last item on this page, or null when there's nothing more. Pass straight back in as `cursor` for the next page. */
  nextCursor: string | null;
}

/**
 * Cursor-paginated version of listSavedItems (Section 20 — Library and
 * Timeline must not load the whole table at once). Cursor is the
 * previous page's last saved_at; fetches one extra row to know whether
 * there's a next page without a separate count query.
 */
export async function listSavedItemsPage(
  userId: string,
  { cursor, limit = 30 }: { cursor?: string | null; limit?: number } = {},
): Promise<SavedItemsPage> {
  const supabase = createClient();
  let query = supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("saved_at", cursor);

  const { data, error } = await query;
  if (error || !data) return { items: [], nextCursor: null };

  const hasMore = data.length > limit;
  const items = (hasMore ? data.slice(0, limit) : data) as SavedItem[];
  return { items, nextCursor: hasMore ? (items[items.length - 1]?.saved_at ?? null) : null };
}

export async function getSavedItem(itemId: string): Promise<SavedItem | null> {
  const supabase = createClient();
  const { data } = await supabase.from("saved_items").select("*").eq("id", itemId).single();
  return (data as SavedItem) ?? null;
}

export async function deleteSavedItem(itemId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("saved_items").delete().eq("id", itemId);
  return { error: error?.message ?? null };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
