"use client";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { IconActionButton } from "@/components/IconActionButton";
import type { Collection } from "@/types/database";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function CollectionCard({
  collection,
  itemCount,
  onEdit,
  onDelete,
}: {
  collection: Collection;
  itemCount: number;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}) {
  const reduced = useReducedMotionSafe();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const accent = collection.accent_color || "#E3A548";

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * 10);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // The two faint offset rectangles behind the main card create the
  // "stack of items" illusion; each drifts a little more than the last
  // as the cursor moves, giving a subtle sense of depth (Section 7.5).
  const backX = useTransform(x, (v) => v * 1.6);
  const backY = useTransform(y, (v) => v * 1.6);
  const midX = useTransform(x, (v) => v * 1.2);
  const midY = useTransform(y, (v) => v * 1.2);

  return (
    <div
      className="group relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        aria-hidden="true"
        style={{ x: backX, y: backY, borderColor: `${accent}33` }}
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border bg-bg-2/40"
      />
      <motion.div
        aria-hidden="true"
        style={{ x: midX, y: midY, borderColor: `${accent}55` }}
        className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg border bg-bg-2/60"
      />

      <motion.div
        style={{ x, y }}
        className="relative rounded-lg border bg-bg-2 p-5 shadow-ambient transition-shadow duration-base group-hover:shadow-elevated"
      >
        <div
          style={{ borderColor: accent }}
          className="pointer-events-none absolute inset-0 rounded-lg border-2 opacity-0 transition-opacity group-hover:opacity-40"
        />

        <Link href={`/app/collections/${collection.id}`} className="block">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl transition-[filter] duration-base group-hover:[filter:drop-shadow(0_0_8px_var(--icon-glow))]"
              style={{ "--icon-glow": accent } as React.CSSProperties}
            >
              {collection.icon || "📁"}
            </span>
            <h3 className="font-display text-lg text-text-primary">{collection.name}</h3>
          </div>
          {collection.description && (
            <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
              {collection.description}
            </p>
          )}
          <p className="mt-3 text-xs text-text-muted">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </Link>

        <div className="card-actions absolute right-2 top-2 flex gap-1 transition-opacity">
          <IconActionButton label="Edit" onClick={() => onEdit(collection)}>
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
                      onDelete(collection);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-danger outline-none hover:bg-danger/10 focus:bg-danger/10"
                >
                  <Trash2 size={13} />
                  {confirmingDelete ? "Click again to delete" : "Delete collection"}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </motion.div>
    </div>
  );
}
