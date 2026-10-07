"use client";

import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectFormDialog, type ProjectFormValues } from "@/components/ProjectFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedButton } from "@/components/AnimatedButton";
import type { Project } from "@/types/database";
import { Plus, Target } from "lucide-react";
import { useState } from "react";

export function ProjectsView({
  initialProjects,
  itemCounts,
  taskCounts,
}: {
  initialProjects: Project[];
  itemCounts: Record<string, number>;
  taskCounts: Record<string, { completed: number; total: number }>;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setDialogOpen(true);
  }

  async function handleSubmit(values: ProjectFormValues): Promise<string | void> {
    if (editing) {
      const res = await fetch(`/api/projects/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't save changes.";
      setProjects((prev) => prev.map((p) => (p.id === editing.id ? json.project : p)));
    } else {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, description: values.description }),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't create that project.";
      setProjects((prev) => [json.project, ...prev]);
    }
  }

  async function handleDelete(project: Project) {
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (!res.ok) setProjects(previous);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-text-primary">Projects</h1>
        {projects.length > 0 && (
          <AnimatedButton size="sm" onClick={openCreate}>
            <Plus size={15} />
            New project
          </AnimatedButton>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="No projects yet."
          subtitle="Projects group saved items (and soon, tasks) around a goal or deliverable you're working toward."
          action={<AnimatedButton onClick={openCreate}>+ New Project</AnimatedButton>}
        />
      ) : (
        <ProjectGrid
          projects={projects}
          itemCounts={itemCounts}
          taskCounts={taskCounts}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
