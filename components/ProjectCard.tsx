"use client";

import { IconActionButton } from "@/components/IconActionButton";
import type { Project } from "@/types/database";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const STATUS_STYLES: Record<Project["status"], { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-accent" },
  completed: { label: "Completed", dot: "bg-success" },
  archived: { label: "Archived", dot: "bg-text-muted" },
};

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? completed / total : 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-2">
      <svg width={34} height={34} className="-rotate-90 shrink-0">
        <circle cx={17} cy={17} r={radius} stroke="var(--border-default)" strokeWidth={3} fill="none" />
        <motion.circle
          cx={17}
          cy={17}
          r={radius}
          stroke="var(--accent)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="text-xs text-text-muted">
        {completed}/{total} tasks
      </span>
    </div>
  );
}

export function ProjectCard({
  project,
  itemCount,
  taskCounts,
  onEdit,
  onDelete,
}: {
  project: Project;
  itemCount: number;
  taskCounts?: { completed: number; total: number };
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const status = STATUS_STYLES[project.status];

  return (
    <div className="group relative rounded-lg border border-border bg-bg-2 p-5 shadow-ambient transition-shadow duration-base hover:shadow-elevated">
      <Link href={`/app/projects/${project.id}`} className="block">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>
        <h3 className="mt-1.5 font-display text-lg text-text-primary">{project.name}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{project.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <motion.p whileHover={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.5 }} className="inline-block text-xs text-text-muted">
            {itemCount} {itemCount === 1 ? "reference" : "references"}
          </motion.p>
          {taskCounts && taskCounts.total > 0 && <ProgressRing {...taskCounts} />}
        </div>
      </Link>

      <div className="card-actions absolute right-2 top-2 flex gap-1 transition-opacity">
        <IconActionButton label="Edit" onClick={() => onEdit(project)}>
          <Pencil size={13} />
        </IconActionButton>
        <DropdownMenu.Root onOpenChange={(o) => !o && setConfirmingDelete(false)}>
          <DropdownMenu.Trigger asChild>
            <IconActionButton label="More">
              <MoreHorizontal size={13} />
            </IconActionButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[10rem] rounded-md border border-border bg-bg-2 p-1 shadow-elevated"
            >
              <DropdownMenu.Item
                onSelect={(e) => {
                  if (!confirmingDelete) {
                    e.preventDefault();
                    setConfirmingDelete(true);
                  } else {
                    onDelete(project);
                  }
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-danger outline-none hover:bg-danger/10 focus:bg-danger/10"
              >
                <Trash2 size={13} />
                {confirmingDelete ? "Click again to delete" : "Delete project"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
