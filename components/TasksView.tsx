"use client";

import { TaskList } from "@/components/TaskList";
import { TaskFormDialog, type TaskFormValues } from "@/components/TaskFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedButton } from "@/components/AnimatedButton";
import type { Project, Task } from "@/types/database";
import { CheckSquare, Plus } from "lucide-react";
import { useState } from "react";

export function TasksView({
  initialTasks,
  referenceCounts,
  projects,
}: {
  initialTasks: Task[];
  referenceCounts: Record<string, number>;
  projects: Project[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  async function handleSubmit(values: TaskFormValues): Promise<string | void> {
    if (editing) {
      const res = await fetch(`/api/tasks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't save changes.";
      setTasks((prev) => prev.map((t) => (t.id === editing.id ? json.task : t)));
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

  function handleToggleComplete(task: Task) {
    const next = !task.is_complete;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_complete: next } : t)));
    void fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_complete: next }),
    });
  }

  async function handleDelete(task: Task) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) setTasks(previous);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-text-primary">Tasks</h1>
        {tasks.length > 0 && (
          <AnimatedButton size="sm" onClick={openCreate}>
            <Plus size={15} />
            New task
          </AnimatedButton>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={40} />}
          title="Nothing waiting for you."
          subtitle="Tasks are lightweight and can optionally link back to a saved item or a project."
          action={<AnimatedButton onClick={openCreate}>+ New Task</AnimatedButton>}
        />
      ) : (
        <TaskList
          tasks={tasks}
          referenceCounts={referenceCounts}
          onToggleComplete={handleToggleComplete}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        projects={projects}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
