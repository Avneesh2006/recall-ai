"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/FormError";
import type { Project, Task, TaskPriority } from "@/types/database";
import { useEffect, useState } from "react";

export interface TaskFormValues {
  title: string;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string | null;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

export function TaskFormDialog({
  open,
  onOpenChange,
  initial,
  projects,
  defaultProjectId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Task | null;
  projects: Project[];
  defaultProjectId?: string | null;
  onSubmit: (values: TaskFormValues) => Promise<string | void>;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setPriority(initial?.priority ?? "normal");
      setDueDate(initial?.due_date ?? "");
      setProjectId(initial?.project_id ?? defaultProjectId ?? null);
      setError(null);
    }
  }, [open, initial, defaultProjectId]);

  async function handleSubmit() {
    if (!title.trim()) return setError("Give it a title.");
    setSaving(true);
    setError(null);
    const err = await onSubmit({
      title: title.trim(),
      priority,
      due_date: dueDate || null,
      project_id: projectId,
    });
    setSaving(false);
    if (err) setError(err);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogTitle className="font-display text-xl text-text-primary">
          {initial ? "Edit task" : "New task"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-text-secondary">
          Lightweight, optionally linked to a project.
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-border bg-bg-1 px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <Label htmlFor="task-project">Project (optional)</Label>
              <select
                id="task-project"
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value || null)}
                className="w-full rounded-md border border-border bg-bg-1 px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FormError message={error ?? undefined} />

          <AnimatedButton onClick={handleSubmit} disabled={saving} className="mt-1">
            {saving ? "Saving…" : initial ? "Save changes" : "Create task"}
          </AnimatedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
