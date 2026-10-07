"use client";

import { ProjectCard } from "@/components/ProjectCard";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { Project } from "@/types/database";
import { motion } from "framer-motion";

export function ProjectGrid({
  projects,
  itemCounts,
  taskCounts,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  itemCounts: Record<string, number>;
  taskCounts?: Record<string, { completed: number; total: number }>;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const reduced = useReducedMotionSafe();

  return (
    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, i) => (
        <motion.div
          key={project.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0.001 : 0.3,
            delay: reduced ? 0 : Math.min(i, 10) * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <ProjectCard
            project={project}
            itemCount={itemCounts[project.id] ?? 0}
            taskCounts={taskCounts?.[project.id]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </div>
  );
}
