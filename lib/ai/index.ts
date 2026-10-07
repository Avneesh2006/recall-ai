import { createServiceClient } from "@/lib/supabase/service";
import type { SavedItem } from "@/types/database";
import { runFullEnrichment } from "./openrouter";

export type { AIService, SavedItemInput, EnrichmentResult, AskRecallAnswer } from "./types";

type ServerSupabase = ReturnType<typeof createServiceClient>;

/**
 * Runs AI enrichment for one item and caches the result permanently in
 * saved_items (ai_category / ai_summary / ai_possible_use) plus
 * AI-sourced rows in tags/saved_item_tags — Section 14's "runs once per
 * item, cached, never re-run automatically." Called (a) fire-and-forget
 * right after a save, via triggerEnrichment, and (b) awaited, on an
 * explicit user click, from POST /api/ai/enrich.
 *
 * Never throws. On any failure — including no OPENROUTER_API_KEY being
 * configured at all — the item is marked ai_status = 'failed' and stays
 * fully usable (Section 4: the app must work with AI down).
 *
 * The Supabase client is created synchronously as the very first line,
 * before any await, for the same reason as enrichUrlMetadataInBackground
 * in lib/db/saved-items.ts: cookies() has to be read while still inside
 * the original request's execution context.
 */
export async function enrichItem(itemId: string): Promise<{ ok: boolean }> {
  // Service-role client — see lib/supabase/service.ts for why background
  // jobs use this instead of the cookie-based client.
  const supabase = createServiceClient();

  try {
    // updated_at lets the UI detect a stuck 'processing' row defensively
    // (MemoryCard/MemoryDetail treat processing older than ~2 minutes as
    // failed) even in the rare case this whole function never gets to
    // run again for that item.
    await supabase
      .from("saved_items")
      .update({ ai_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", itemId);

    const { data } = await supabase.from("saved_items").select("*").eq("id", itemId).single();
    const item = data as SavedItem | null;
    if (!item) {
      // Previously returned here without marking the row failed, which
      // left it stuck at 'processing' forever if the row genuinely
      // couldn't be read back (deleted mid-flight, etc.) — this was a
      // real bug, not just a defensive branch.
      await markFailed(supabase, itemId).catch(() => {});
      return { ok: false };
    }

    const result = await runFullEnrichment({
      title: item.title,
      description: item.description,
      url: item.url,
      input_type: item.input_type,
      content_type: item.content_type,
      source_domain: item.source_domain,
      what_was_i_thinking: item.what_was_i_thinking,
      content_text: item.content_text,
      media_url: item.source_media_url ?? (item.input_type !== "url" ? item.url : null),
      thumbnail_url: item.thumbnail_url,
      media_kind: inferMediaKind(item),
    });

    if (!result) {
      await markFailed(supabase, itemId);
      return { ok: false };
    }

    await supabase
      .from("saved_items")
      .update({
        ai_category: result.category,
        ai_summary: result.summary,
        ai_content: result.contentUnderstanding,
        ai_possible_use: result.possibleUse,
        ai_status: "done",
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    await upsertAiTags(supabase, item.user_id, itemId, result.tags);
    return { ok: true };
  } catch {
    await markFailed(supabase, itemId).catch(() => {});
    return { ok: false };
  }
}

/** Fire-and-forget entry point used right after a save. */
export async function triggerEnrichment(itemId: string): Promise<void> {
  // Awaits now (used to be fire-and-forget `void`). enrichItem never
  // throws, so this never rejects either — the point of awaiting is
  // purely so this function's own promise doesn't resolve until the
  // real work is done, which is what lets a single waitUntil() at the
  // call site (Vercel) cover the whole chain transitively instead of
  // needing waitUntil at every nested level.
  await enrichItem(itemId);
}

function inferMediaKind(item: SavedItem): "image" | "video" | "pdf" | null {
  const type = (item.content_type ?? "").toLowerCase();
  if (type.startsWith("image/") || type === "image") return "image";
  if (type.startsWith("video/") || type === "video") return "video";
  if (
    type.includes("pdf") ||
    ((item.url ?? "").toLowerCase().split("?")[0] ?? "").endsWith(".pdf")
  ) {
    return "pdf";
  }
  return null;
}

async function markFailed(supabase: ServerSupabase, itemId: string) {
  await supabase
    .from("saved_items")
    .update({ ai_status: "failed", ai_processed_at: new Date().toISOString() })
    .eq("id", itemId);
}

/**
 * Two queries regardless of tag count: one batched upsert into `tags`
 * (unique on user_id + name, so an existing tag is reused rather than
 * duplicated), then one batched upsert of the links, tagged
 * source = 'ai' so AI-added tags stay distinguishable from ones the
 * user added themselves (Section 10).
 */
async function upsertAiTags(
  supabase: ServerSupabase,
  userId: string,
  itemId: string,
  names: string[],
) {
  if (names.length === 0) return;

  const { data: tags } = await supabase
    .from("tags")
    .upsert(
      names.map((name) => ({ user_id: userId, name })),
      { onConflict: "user_id,name" },
    )
    .select();

  if (!tags || tags.length === 0) return;

  await supabase.from("saved_item_tags").upsert(
    (tags as { id: string }[]).map((t) => ({
      saved_item_id: itemId,
      tag_id: t.id,
      source: "ai",
    })),
    { onConflict: "saved_item_id,tag_id", ignoreDuplicates: true },
  );
}
