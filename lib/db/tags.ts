import { createClient } from "@/lib/supabase/server";

export interface ItemTag {
  name: string;
  source: "user" | "ai";
}

export async function getItemTags(itemId: string): Promise<ItemTag[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("saved_item_tags")
    .select("source, tags(name)")
    .eq("saved_item_id", itemId);

  return ((data ?? []) as unknown as { source: "user" | "ai"; tags: { name: string } | null }[])
    .filter((row) => row.tags)
    .map((row) => ({ name: row.tags!.name, source: row.source }));
}

/** Tag names for many items in one query — used to build Ask Recall's candidate set. */
export async function getTagsForItems(itemIds: string[]): Promise<Record<string, string[]>> {
  if (itemIds.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase
    .from("saved_item_tags")
    .select("saved_item_id, tags(name)")
    .in("saved_item_id", itemIds);

  const byItem: Record<string, string[]> = {};
  for (const row of (data ?? []) as unknown as {
    saved_item_id: string;
    tags: { name: string } | null;
  }[]) {
    if (!row.tags) continue;
    (byItem[row.saved_item_id] ??= []).push(row.tags.name);
  }
  return byItem;
}
