"use client";

import { MemoryGrid } from "@/components/MemoryGrid";
import { TaskList } from "@/components/TaskList";
import { TaskFormDialog, type TaskFormValues } from "@/components/TaskFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { ProjectFormDialog, type ProjectFormValues } from "@/components/ProjectFormDialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useSavedItemActions } from "@/hooks/useSavedItemActions";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import type { Collection, Project, SavedItem, Task } from "@/types/database";
import { BackButton } from "@/components/BackButton";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STATUS_STYLES: Record<Project["status"], { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-accent" },
  completed: { label: "Completed", dot: "bg-success" },
  archived: { label: "Archived", dot: "bg-text-muted" },
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ProjectDetailView({
  project,
  initialItems,
  initialTasks,
  taskReferenceCounts,
}: {
  project: Project;
  initialItems: SavedItem[];
  initialTasks: Task[];
  taskReferenceCounts: Record<string, number>;
}) {
  const router = useRouter();
  const { open } = useSaveDialog();
  const { items, toggleFavorite, toggleArchive, remove, editTitle, moveToCollection, turnIntoTask, similarCounts } =
    useSavedItemActions(initialItems);
  const [tasks, setTasks] = useState(initialTasks);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState(project);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((json) => setCollections(json.collections ?? []))
      .catch(() => {});
  }, []);

  async function handleEditSubmit(values: ProjectFormValues): Promise<string | void> {
    const res = await fetch(`/api/projects/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) return json.error ?? "Couldn't save changes.";
    setCurrent(json.project);
  }

  async function handleDeleteProject() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await fetch(`/api/projects/${current.id}`, { method: "DELETE" });
    router.push("/app/projects");
  }

  async function handleTaskSubmit(values: TaskFormValues): Promise<string | void> {
    if (editingTask) {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't save changes.";
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? json.task : t)));
    } else {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't create that task.";
      setTasks((prev) => [json.task, ...prev]);
    }
  }

  function handleToggleTaskComplete(task: Task) {
    const next = !task.is_complete;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_complete: next } : t)));
    void fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_complete: next }),
    });
  }

  async function handleDeleteTask(task: Task) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) setTasks(previous);
  }

  const visibleItems = items.filter((i) => i.project_id === current.id);
  const status = STATUS_STYLES[current.status];

  // "Lightweight activity feed derived from timestamps" (Section 18) —
  // merges item saves and task completions into one chronological list,
  // rather than a separate activity-log table.
  const recentActivity = useMemo(() => {
    const events = [
      ...visibleItems.map((i) => ({
        at: i.saved_at,
        label: `saved "${i.title || i.url}"`,
      })),
      ...tasks
        .filter((t) => t.completed_at)
        .map((t) => ({ at: t.completed_at as string, label: `completed "${t.title}"` })),
    ];
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [visibleItems, tasks]);

  const completedCount = tasks.filter((t) => t.is_complete).length;

  return (
    <div>
      <BackButton fallbackHref="/app/projects" label="Projects" />
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
            {tasks.length > 0 && (
              <span>
                · {completedCount}/{tasks.length} tasks
              </span>
            )}
          </div>
          <h1 className="mt-1 font-display text-3xl text-text-primary">{current.name}</h1>
          {current.description && (
            <p className="mt-1 text-text-secondary">{current.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <AnimatedButton variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            Edit
          </AnimatedButton>
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={handleDeleteProject}
            className="text-danger"
          >
            <Trash2 size={14} />
            {confirmingDelete ? "Click again to confirm" : "Delete"}
          </AnimatedButton>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="mb-6 rounded-lg border border-border-subtle bg-bg-1 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Recent activity
          </p>
          <ul className="flex flex-col gap-1.5">
            {recentActivity.map((event, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-text-muted">{timeAgo(event.at)}</span>
                <span className="truncate">{event.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-text-primary">Tasks</h2>
          <AnimatedButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingTask(null);
              setTaskDialogOpen(true);
            }}
          >
            <Plus size={14} />
            New task
          </AnimatedButton>
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted">No tasks linked to this project yet.</p>
        ) : (
          <TaskList
            tasks={tasks}
            referenceCounts={taskReferenceCounts}
            onToggleComplete={handleToggleTaskComplete}
            onEdit={(t) => {
              setEditingTask(t);
              setTaskDialogOpen(true);
            }}
            onDelete={handleDeleteTask}
          />
        )}
      </div>

      <h2 className="mb-3 font-display text-lg text-text-primary">References</h2>
      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="Nothing linked yet."
          subtitle="Save something new into this project, or move an existing item here from its card menu in the Library."
          action={<AnimatedButton onClick={open}>+ Save Something</AnimatedButton>}
        />
      ) : (
        <MemoryGrid
          items={visibleItems}
          similarCounts={similarCounts}
          collections={collections}
          onToggleFavorite={toggleFavorite}
          onToggleArchive={toggleArchive}
          onDelete={remove}
          onEditTitle={editTitle}
          onMoveToCollection={moveToCollection}
          onTurnIntoTask={turnIntoTask}
        />
      )}

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={current}
        onSubmit={handleEditSubmit}
      />
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        initial={editingTask}
        projects={[current]}
        defaultProjectId={current.id}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}
