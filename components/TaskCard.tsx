"use client";

import { ContentTypeGlyph } from "@/components/Badges";
import { IconActionButton } from "@/components/IconActionButton";
import type { SavedItem, Task, TaskPriority } from "@/types/database";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "text-text-muted",
  normal: "text-text-secondary",
  high: "text-danger",
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskCard({
  task,
  referenceCount,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  referenceCount: number;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [references, setReferences] = useState<SavedItem[] | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleExpandToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && references === null) {
      setLoadingRefs(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}`);
        const json = await res.json();
        setReferences(json.items ?? []);
      } finally {
        setLoadingRefs(false);
      }
    }
  }

  return (
    <div className="rounded-lg border border-border bg-bg-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={task.is_complete}
          aria-label={task.is_complete ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-accent"
        >
          <AnimatePresence>
            {task.is_complete && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="flex h-full w-full items-center justify-center rounded-sm bg-accent"
              >
                <Check size={12} className="text-text-onaccent" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`relative inline-block text-sm ${task.is_complete ? "text-text-muted" : "text-text-primary"}`}
            >
              {task.title}
              {task.is_complete && (
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute left-0 top-1/2 h-px bg-text-muted"
                />
              )}
            </span>
            {task.priority !== "normal" && (
              <span className={`text-[10px] uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
            {task.due_date && <span>{formatDueDate(task.due_date)}</span>}
            {referenceCount > 0 && (
              <button
                type="button"
                onClick={handleExpandToggle}
                className="flex items-center gap-1 transition-colors hover:text-text-secondary"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                {referenceCount} {referenceCount === 1 ? "reference" : "references"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-col gap-1.5">
                  {loadingRefs ? (
                    <p className="text-xs text-text-muted">Loading…</p>
                  ) : (
                    references?.map((item) => (
                      <Link
                        key={item.id}
                        href={`/app/item/${item.id}`}
                        className="flex items-center gap-1.5 rounded border border-border-subtle px-2 py-1 text-xs text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
                      >
                        <ContentTypeGlyph contentType={item.content_type} />
                        <span className="truncate">{item.title || item.url}</span>
                      </Link>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 gap-1">
          <IconActionButton label="Edit" onClick={() => onEdit(task)}>
            <Pencil size={13} />
          </IconActionButton>
          <IconActionButton
            label={confirmingDelete ? "Click again to delete" : "Delete"}
            onClick={() => {
              if (!confirmingDelete) {
                setConfirmingDelete(true);
                setTimeout(() => setConfirmingDelete(false), 3000);
              } else {
                onDelete(task);
              }
            }}
            className={confirmingDelete ? "border-danger/40 text-danger" : ""}
          >
            <Trash2 size={13} />
          </IconActionButton>
        </div>
      </div>
    </div>
  );
}
