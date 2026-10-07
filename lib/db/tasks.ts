import { createClient } from "@/lib/supabase/server";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validation/task";
import type { SavedItem, Task } from "@/types/database";

export async function listTasks(userId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Task[];
}

export async function listTasksByProject(userId: string, projectId: string): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = createClient();
  const { data } = await supabase.from("tasks").select("*").eq("id", id).single();
  return (data as Task) ?? null;
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<{ task: Task | null; error: string | null }> {
  const supabase = createClient();
  const { saved_item_id, ...taskFields } = input;

  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, ...taskFields })
    .select()
    .single();

  if (error) return { task: null, error: error.message };
  const task = data as Task;

  // "Turn into task" (Section 5 Flow D) — auto-link back to the source
  // memory. Best-effort: the task itself is already created and saved
  // either way, so a failure here shouldn't surface as a failed save.
  if (saved_item_id) {
    await supabase.from("task_references").insert({ task_id: task.id, saved_item_id });
  }

  return { task, error: null };
}

export async function updateTask(
  id: string,
  patch: UpdateTaskInput,
): Promise<{ task: Task | null; error: string | null }> {
  const supabase = createClient();
  const body: Record<string, unknown> = { ...patch };
  if (patch.is_complete !== undefined) {
    body.completed_at = patch.is_complete ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return { task: null, error: error.message };
  return { task: data as Task, error: null };
}

export async function deleteTask(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Reference count per task, for the collapsed list view. RLS on
 * task_references restricts rows to ones whose parent task belongs to
 * the current user, so this plain select is already scoped correctly
 * without needing to pass a task-id list in.
 */
export async function getTaskReferenceCounts(userId: string): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, task_references(count)")
    .eq("user_id", userId);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { id: string; task_references: { count: number }[] }[]) {
    counts[row.id] = row.task_references?.[0]?.count ?? 0;
  }
  return counts;
}

/**
 * Per-project task totals for the progress ring (Section 18: "computed
 * client-side as completed tasks / total tasks for that project — no
 * separate progress field"). Computed here server-side instead since we
 * already have the full task list loaded on the Projects page anyway.
 */
export async function getProjectTaskCounts(
  userId: string,
): Promise<Record<string, { completed: number; total: number }>> {
  const tasks = await listTasks(userId);
  const counts: Record<string, { completed: number; total: number }> = {};

  for (const task of tasks) {
    if (!task.project_id) continue;
    const entry = counts[task.project_id] ?? { completed: 0, total: 0 };
    entry.total += 1;
    if (task.is_complete) entry.completed += 1;
    counts[task.project_id] = entry;
  }

  return counts;
}

/** Full linked items for one task — fetched on demand when a task row expands. */
export async function getTaskReferenceItems(taskId: string): Promise<SavedItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("task_references")
    .select("saved_items(*)")
    .eq("task_id", taskId);

  return ((data ?? []) as unknown as { saved_items: SavedItem }[])
    .map((row) => row.saved_items)
    .filter(Boolean);
}
