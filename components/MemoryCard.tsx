"use client";

import { Tilt3DCard } from "@/components/Tilt3DCard";
import { MediaPreview } from "@/components/MediaPreview";
import { EditableTitle } from "@/components/EditableTitle";
import { IconActionButton } from "@/components/IconActionButton";
import { SourceBadge } from "@/components/Badges";
import { AIPendingNote, AIUnavailableNote } from "@/components/AIInsightBadge";
import { getPatinaLevel } from "@/lib/patina";
import { isActivelyProcessing, isEffectivelyFailed } from "@/lib/ai-status";
import { REASON_TAGS, type Collection, type Project, type SavedItem } from "@/types/database";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveRestore, Check, CheckSquare, FolderInput, Layers, MoreHorizontal, Sparkles, Star, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const reasonLabel = (tag: string | null) =>
  REASON_TAGS.find((r) => r.value === tag)?.label ?? null;

export function MemoryCard({
  item,
  similarCount = 0,
  collections = [],
  projects = [],
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onEditTitle,
  onFindSimilar,
  onMoveToCollection,
  onMoveToProject,
  onTurnIntoTask,
}: {
  item: SavedItem;
  similarCount?: number;
  collections?: Collection[];
  projects?: Project[];
  onToggleFavorite: (item: SavedItem) => void;
  onToggleArchive: (item: SavedItem) => void;
  onDelete: (item: SavedItem) => void;
  onEditTitle: (item: SavedItem, newTitle: string) => void;
  onFindSimilar?: (item: SavedItem) => void;
  onMoveToCollection?: (item: SavedItem, collectionId: string | null) => void;
  onMoveToProject?: (item: SavedItem, projectId: string | null) => void;
  onTurnIntoTask?: (item: SavedItem) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const patina = getPatinaLevel(item.saved_at);

  return (
    <Tilt3DCard
      className="group flex h-full flex-col"
      style={
        patina.intensity > 0
          ? {
              // The "amber patina" feature — see lib/patina.ts. Warms the
              // card's border and adds a faint inner glow that deepens
              // the longer a memory has been sitting, literalizing the
              // "preserved in amber" concept instead of just decorating
              // with it.
              borderColor: `rgba(227, 165, 72, ${0.14 + patina.intensity * 0.3})`,
              boxShadow: `inset 0 0 ${16 + patina.intensity * 24}px rgba(227, 165, 72, ${patina.intensity * 0.16})`,
            }
          : undefined
      }
    >
      <Link href={`/app/item/${item.id}`} className="flex flex-1 flex-col p-4">
        <MediaPreview item={item} />

        <div className="flex items-center gap-1.5">
          <SourceBadge domain={item.source_domain} />
          <span className="text-xs text-text-muted">· {timeAgo(item.saved_at)}</span>
          {patina.isAged && (
            <span
              title={patina.label}
              className="ml-auto text-[10px] italic text-accent-text/70"
            >
              {patina.label}
            </span>
          )}
        </div>

        <EditableTitle
          title={item.title}
          fallback={item.url || "Untitled"}
          onCommit={(newTitle) => onEditTitle(item, newTitle)}
        />

        {item.what_was_i_thinking && (
          <p className="mt-2 line-clamp-2 text-sm italic text-accent-text/90">
            &ldquo;{item.what_was_i_thinking}&rdquo;
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {reasonLabel(item.reason_tag) && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary">
              {reasonLabel(item.reason_tag)}
            </span>
          )}
          {isActivelyProcessing(item) ? (
            <AIPendingNote />
          ) : isEffectivelyFailed(item) ? (
            <AIUnavailableNote />
          ) : item.ai_status === "done" && item.ai_category ? (
            <span
              title={item.ai_summary ? `AI suggestion: ${item.ai_summary}` : "AI suggestion"}
              className="inline-flex items-center gap-1 rounded-full bg-bg-3 px-2 py-0.5 text-[11px] text-text-secondary"
            >
              <Sparkles size={10} className="text-text-muted" />
              {item.ai_category}
            </span>
          ) : null}
          {similarCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFindSimilar?.(item);
              }}
              title="You've saved similar things before"
              className="ml-auto flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-text-muted transition-colors hover:border-border-accent hover:text-accent-text"
            >
              <Layers size={10} />
              {similarCount} similar
            </button>
          )}
        </div>
      </Link>

      {/* Hover action row — fades/slides in (Section 7.6) */}
      <div className="card-actions absolute right-2 top-2 flex gap-1 transition-all duration-base ease-out">
        <FavoriteButton item={item} onToggle={onToggleFavorite} />
        <IconActionButton
          label={item.is_archived ? "Restore" : "Archive"}
          onClick={(e) => {
            e.preventDefault();
            onToggleArchive(item);
          }}
        >
          {item.is_archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </IconActionButton>
        <DropdownMenu.Root
          onOpenChange={(open) => {
            if (!open) setConfirmingDelete(false);
          }}
        >
          <DropdownMenu.Trigger asChild>
            <IconActionButton label="More">
              <MoreHorizontal size={14} />
            </IconActionButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[11rem] rounded-md border border-border bg-bg-2 p-1 shadow-elevated"
            >
              {onTurnIntoTask && (
                <DropdownMenu.Item
                  onSelect={() => onTurnIntoTask(item)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3"
                >
                  <CheckSquare size={14} />
                  Turn into task
                </DropdownMenu.Item>
              )}
              {onMoveToCollection && (
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3 data-[state=open]:bg-bg-3">
                    <FolderInput size={14} />
                    Move to collection
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent className="z-50 min-w-[11rem] rounded-md border border-border bg-bg-2 p-1 shadow-elevated">
                      <DropdownMenu.Item
                        onSelect={() => onMoveToCollection(item, null)}
                        className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3"
                      >
                        No collection
                        {!item.collection_id && <Check size={13} />}
                      </DropdownMenu.Item>
                      {collections.length > 0 && (
                        <div className="my-1 h-px bg-border-subtle" />
                      )}
                      {collections.map((c) => (
                        <DropdownMenu.Item
                          key={c.id}
                          onSelect={() => onMoveToCollection(item, c.id)}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{c.icon || "📁"}</span>
                            <span className="truncate">{c.name}</span>
                          </span>
                          {item.collection_id === c.id && <Check size={13} />}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              )}
              {onMoveToProject && (
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3 data-[state=open]:bg-bg-3">
                    <Target size={14} />
                    Move to project
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent className="z-50 min-w-[11rem] rounded-md border border-border bg-bg-2 p-1 shadow-elevated">
                      <DropdownMenu.Item
                        onSelect={() => onMoveToProject(item, null)}
                        className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3"
                      >
                        No project
                        {!item.project_id && <Check size={13} />}
                      </DropdownMenu.Item>
                      {projects.length > 0 && <div className="my-1 h-px bg-border-subtle" />}
                      {projects.map((p) => (
                        <DropdownMenu.Item
                          key={p.id}
                          onSelect={() => onMoveToProject(item, p.id)}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-text-secondary outline-none hover:bg-bg-3"
                        >
                          <span className="truncate">{p.name}</span>
                          {item.project_id === p.id && <Check size={13} />}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              )}
              <DropdownMenu.Item
                onSelect={(e) => {
                  if (!confirmingDelete) {
                    e.preventDefault();
                    setConfirmingDelete(true);
                  } else {
                    onDelete(item);
                  }
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-danger outline-none hover:bg-danger/10 focus:bg-danger/10"
              >
                <Trash2 size={14} />
                {confirmingDelete ? "Click again to delete" : "Delete"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </Tilt3DCard>
  );
}

function FavoriteButton({
  item,
  onToggle,
}: {
  item: SavedItem;
  onToggle: (item: SavedItem) => void;
}) {
  const [burst, setBurst] = useState(false);

  return (
    <button
      type="button"
      aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
      title={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => {
        e.preventDefault();
        if (!item.is_favorite) {
          setBurst(true);
          setTimeout(() => setBurst(false), 400);
        }
        onToggle(item);
      }}
      className="relative flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg-2/90 text-text-secondary backdrop-blur transition-colors hover:bg-bg-3 hover:text-accent-text"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={item.is_favorite ? "filled" : "outline"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <Star
            size={14}
            className={cn(item.is_favorite && "fill-accent text-accent-text")}
          />
        </motion.span>
      </AnimatePresence>
      {burst && (
        <motion.span
          className="absolute inset-0 rounded-md bg-accent/40"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </button>
  );
}
