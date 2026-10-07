"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/FormError";
import type { Project, ProjectStatus } from "@/types/database";
import { useEffect, useState } from "react";

export interface ProjectFormValues {
  name: string;
  description: string;
  status: ProjectStatus;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Project | null;
  onSubmit: (values: ProjectFormValues) => Promise<string | void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setStatus(initial?.status ?? "active");
      setError(null);
    }
  }, [open, initial]);

  async function handleSubmit() {
    if (!name.trim()) return setError("Give it a name.");
    setSaving(true);
    setError(null);
    const err = await onSubmit({ name: name.trim(), description: description.trim(), status });
    setSaving(false);
    if (err) setError(err);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogTitle className="font-display text-xl text-text-primary">
          {initial ? "Edit project" : "New project"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-text-secondary">
          A container for a goal or deliverable — the saved items, and eventually the tasks,
          that go with it.
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="JIC Recruitment Reel"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div>
            <Label htmlFor="project-description">Description (optional)</Label>
            <Input
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {initial && (
            <div>
              <Label htmlFor="project-status">Status</Label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-md border border-border bg-bg-1 px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FormError message={error ?? undefined} />

          <AnimatedButton onClick={handleSubmit} disabled={saving} className="mt-1">
            {saving ? "Saving…" : initial ? "Save changes" : "Create project"}
          </AnimatedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
