import { createClient } from "@/lib/supabase/server";

/**
 * Full relational export of everything the user owns (Section 27).
 * Every query filters on user_id explicitly, on top of RLS already
 * scoping these tables to the caller — belt and suspenders for an
 * operation whose whole point is "give the person all their data."
 */
export async function exportUserData(userId: string) {
  const supabase = createClient();

  const [items, collections, projects, tasks, tags, itemTags, taskRefs] = await Promise.all([
    supabase.from("saved_items").select("*").eq("user_id", userId),
    supabase.from("collections").select("*").eq("user_id", userId),
    supabase.from("projects").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("tags").select("*").eq("user_id", userId),
    // Join tables have no user_id of their own — RLS (via the parent
    // row's owner) is what actually scopes these two queries.
    supabase.from("saved_item_tags").select("saved_item_id, tag_id, source"),
    supabase.from("task_references").select("task_id, saved_item_id"),
  ]);

  return {
    exported_at: new Date().toISOString(),
    saved_items: items.data ?? [],
    collections: collections.data ?? [],
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    tags: tags.data ?? [],
    saved_item_tags: itemTags.data ?? [],
    task_references: taskRefs.data ?? [],
  };
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV can't naturally represent several relational tables at once, so
 * this flattens to one row per saved item — the primary entity — with
 * collection/project names and tags joined in as columns, rather than
 * shipping multiple CSV files. The JSON export (above) carries the full
 * relational structure for anyone who wants that instead.
 */
export function toExportCsv(data: Awaited<ReturnType<typeof exportUserData>>): string {
  const collectionName = new Map(data.collections.map((c: any) => [c.id, c.name]));
  const projectName = new Map(data.projects.map((p: any) => [p.id, p.name]));
  const tagName = new Map(data.tags.map((t: any) => [t.id, t.name]));
  const tagsByItem = new Map<string, string[]>();
  for (const link of data.saved_item_tags as any[]) {
    const name = tagName.get(link.tag_id);
    if (!name) continue;
    const list = tagsByItem.get(link.saved_item_id) ?? [];
    list.push(name);
    tagsByItem.set(link.saved_item_id, list);
  }

  const headers = [
    "title", "url", "input_type", "content_type", "reason_tag",
    "what_was_i_thinking", "description", "collection", "project", "tags",
    "ai_category", "ai_summary", "is_favorite", "is_archived", "saved_at",
  ];

  const rows = (data.saved_items as any[]).map((item) =>
    [
      item.title, item.url, item.input_type, item.content_type, item.reason_tag,
      item.what_was_i_thinking, item.description,
      item.collection_id ? collectionName.get(item.collection_id) : "",
      item.project_id ? projectName.get(item.project_id) : "",
      (tagsByItem.get(item.id) ?? []).join("; "),
      item.ai_category, item.ai_summary, item.is_favorite, item.is_archived, item.saved_at,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
