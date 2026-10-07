import { createClient } from "@/lib/supabase/server";
import type { SavedItem } from "@/types/database";

export interface RelatedMemory {
  item: SavedItem;
  /** Short, human-readable reasons, e.g. "Same collection", "Shared tags: reel, color". */
  reasons: string[];
}

const PER_QUERY_LIMIT = 30;

const POINTS = { collection: 3, project: 3, tag: 2, category: 2, domain: 1 } as const;

/**
 * Related Memories (Section 6, Phase 15). Pure structure, no AI: scores
 * the user's other active items on how much they overlap with this one —
 * same collection, same project, shared tags, same AI category, same
 * source. Always available, costs nothing, and every result carries the
 * plain-language reasons it was picked, so it never feels like a black
 * box. The AI-assisted pass is a separate, explicit user action
 * (POST /api/ai/related).
 *
 * Runs entirely under the caller's session (RLS applies) and every
 * query also filters on user_id explicitly.
 */
export async function getRelatedMemories(
  userId: string,
  item: SavedItem,
  limit = 6,
): Promise<RelatedMemory[]> {
  const supabase = createClient();

  const byAttribute = async (column: string, value: string | null): Promise<SavedItem[]> => {
    if (!value) return [];
    const { data } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .eq(column, value)
      .neq("id", item.id)
      .limit(PER_QUERY_LIMIT);
    return (data ?? []) as SavedItem[];
  };

  const [byCollection, byProject, byCategory, byDomain, ownTagRes] = await Promise.all([
    byAttribute("collection_id", item.collection_id),
    byAttribute("project_id", item.project_id),
    byAttribute("ai_category", item.ai_category),
    byAttribute("source_domain", item.source_domain),
    supabase.from("saved_item_tags").select("tag_id, tags(name)").eq("saved_item_id", item.id),
  ]);

  const scored = new Map<string, { item?: SavedItem; score: number; reasons: string[] }>();
  const bump = (id: string, row: SavedItem | undefined, points: number, reason: string) => {
    const entry = scored.get(id) ?? { item: row, score: 0, reasons: [] };
    entry.item ??= row;
    entry.score += points;
    if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
    scored.set(id, entry);
  };

  for (const row of byCollection) bump(row.id, row, POINTS.collection, "Same collection");
  for (const row of byProject) bump(row.id, row, POINTS.project, "Same project");
  for (const row of byCategory) bump(row.id, row, POINTS.category, "Same category");
  for (const row of byDomain) bump(row.id, row, POINTS.domain, "Same source");

  // Shared tags: find other items carrying any of this item's tags.
  const ownTags = (ownTagRes.data ?? []) as unknown as {
    tag_id: string;
    tags: { name: string } | null;
  }[];
  const tagNameById = new Map(ownTags.map((t) => [t.tag_id, t.tags?.name ?? ""]));
  const tagIds = [...tagNameById.keys()];

  if (tagIds.length > 0) {
    const { data } = await supabase
      .from("saved_item_tags")
      .select("saved_item_id, tag_id")
      .in("tag_id", tagIds)
      .neq("saved_item_id", item.id);

    const sharedByItem = new Map<string, string[]>();
    for (const row of (data ?? []) as { saved_item_id: string; tag_id: string }[]) {
      const name = tagNameById.get(row.tag_id);
      if (!name) continue;
      sharedByItem.set(row.saved_item_id, [...(sharedByItem.get(row.saved_item_id) ?? []), name]);
    }
    for (const [id, names] of sharedByItem) {
      bump(id, scored.get(id)?.item, POINTS.tag * names.length, `Shared tags: ${names.join(", ")}`);
    }
  }

  // Items that matched only through tags haven't been loaded yet.
  const missingIds = [...scored.entries()].filter(([, e]) => !e.item).map(([id]) => id);
  if (missingIds.length > 0) {
    const { data } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .in("id", missingIds);
    for (const row of (data ?? []) as SavedItem[]) {
      const entry = scored.get(row.id);
      if (entry) entry.item = row;
    }
  }

  return [...scored.values()]
    .filter((e): e is { item: SavedItem; score: number; reasons: string[] } => Boolean(e.item))
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.item.saved_at).getTime() - new Date(a.item.saved_at).getTime(),
    )
    .slice(0, limit)
    .map(({ item: related, reasons }) => ({ item: related, reasons }));
}
