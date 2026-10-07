"use client";

import { ContentTypeGlyph } from "@/components/Badges";
import { REASON_TAGS, type SavedItem } from "@/types/database";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import Link from "next/link";

function groupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - startOfDay.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function exactTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const reasonLabel = (tag: string | null) => REASON_TAGS.find((r) => r.value === tag)?.label ?? null;

function groupByDay(items: SavedItem[]): { label: string; items: SavedItem[] }[] {
  const groups: { label: string; items: SavedItem[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.saved_at);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function MemoryTimeline({ items }: { items: SavedItem[] }) {
  const reduced = useReducedMotionSafe();
  const groups = groupByDay(items);

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[7px] top-2 w-px bg-border-subtle" aria-hidden="true" />
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="relative mb-3 pl-6 text-xs font-medium uppercase tracking-wide text-text-muted">
              <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-accent bg-bg-0" />
              {group.label}
            </p>
            <div className="flex flex-col gap-2 pl-6">
              {group.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: reduced ? 0.001 : 0.25,
                    delay: reduced ? 0 : Math.min(i, 8) * 0.03,
                  }}
                >
                  <Link
                    href={`/app/item/${item.id}`}
                    title={exactTime(item.saved_at)}
                    className="group flex items-start gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-bg-2"
                  >
                    <span className="mt-0.5 text-base leading-none">
                      <ContentTypeGlyph contentType={item.content_type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm text-text-primary">
                          {item.title || item.url || "Untitled"}
                        </p>
                        {reasonLabel(item.reason_tag) && (
                          <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-text-muted">
                            {reasonLabel(item.reason_tag)}
                          </span>
                        )}
                      </div>
                      {item.what_was_i_thinking && (
                        <p className="mt-0.5 truncate text-xs italic text-accent-text/80">
                          &ldquo;{item.what_was_i_thinking}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
                      {new Date(item.saved_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
