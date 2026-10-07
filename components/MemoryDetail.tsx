"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { ContentTypeGlyph, SourceBadge } from "@/components/Badges";
import { ReasonSelector } from "@/components/ReasonSelector";
import { WhatWasIThinkingInput } from "@/components/WhatWasIThinking";
import { AIInsightBadge, AIPendingNote, AIUnavailableNote } from "@/components/AIInsightBadge";
import { isActivelyProcessing, isEffectivelyFailed } from "@/lib/ai-status";
import { CategoryBadge, Tag } from "@/components/Badges";
import { EditableTitle } from "@/components/EditableTitle";
import { TagEditor } from "@/components/TagEditor";
import { MediaPreview } from "@/components/MediaPreview";
import type { ItemTag } from "@/lib/db/tags";
import type { Collection, Project, ReasonTag, SavedItem } from "@/types/database";
import { Archive, ArchiveRestore, CheckSquare, ExternalLink, FolderInput, RefreshCw, Star, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MemoryDetail({ item, tags }: { item: SavedItem; tags: ItemTag[] }) {
  const router = useRouter();
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const [title, setTitle] = useState(item.title);
  const [reasonTag, setReasonTag] = useState<ReasonTag | null>(item.reason_tag);
  const [note, setNote] = useState(item.what_was_i_thinking ?? "");
  const [isFavorite, setIsFavorite] = useState(item.is_favorite);
  const [isArchived, setIsArchived] = useState(item.is_archived);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionId, setCollectionId] = useState(item.collection_id);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(item.project_id);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((json) => setCollections(json.collections ?? []))
      .catch(() => {});
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => setProjects(json.projects ?? []))
      .catch(() => {});
  }, []);

  const dirty = reasonTag !== item.reason_tag || note !== (item.what_was_i_thinking ?? "");

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function handleSaveContext() {
    setSaving(true);
    try {
      await patch({ reason_tag: reasonTag, what_was_i_thinking: note.trim() || null });
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  async function handleCollectionChange(newId: string | null) {
    setCollectionId(newId);
    void patch({ collection_id: newId });
  }

  async function handleProjectChange(newId: string | null) {
    setProjectId(newId);
    void patch({ project_id: newId });
  }

  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    void patch({ is_favorite: next });
  }

  async function handleToggleArchive() {
    const next = !isArchived;
    setIsArchived(next);
    void patch({ is_archived: next });
  }

  async function handleTitleCommit(newTitle: string) {
    setTitle(newTitle);
    await patch({ title: newTitle });
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    setReanalyzeError(null);
    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setReanalyzeError(json.error ?? "AI organizing is unavailable right now.");
      }
      // Re-run the server component so the fresh ai_* fields and tags come back as props.
      router.refresh();
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleTurnIntoTask() {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || item.url || "Untitled task", saved_item_id: item.id }),
    });
    setTaskCreated(true);
    setTimeout(() => setTaskCreated(false), 2500);
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    router.push("/app/library");
  }

  return (
    <div>
      {(item.thumbnail_url || item.content_type === "video") && <MediaPreview item={item} />}

      <div className="flex items-center gap-1.5 text-sm">
        <ContentTypeGlyph contentType={item.content_type} />
        <SourceBadge domain={item.source_domain} />
        <span className="text-text-muted">
          · saved {new Date(item.saved_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </span>
      </div>

      <EditableTitle
        as="h1"
        title={title}
        fallback={item.url || "Untitled"}
        onCommit={handleTitleCommit}
        className="mt-2 cursor-text font-display text-3xl text-text-primary transition-colors hover:text-accent-text/90"
        inputClassName="mt-2 w-full rounded border border-accent bg-bg-1 px-2 py-1 font-display text-3xl text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      />

      {item.description && <p className="mt-3 text-text-secondary">{item.description}</p>}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent-text hover:underline"
        >
          Open original <ExternalLink size={13} />
        </a>
      )}

      <div className="mt-4">
        {isActivelyProcessing(item) ? (
          <AIPendingNote />
        ) : isEffectivelyFailed(item) ? (
          <AIUnavailableNote />
        ) : item.ai_status === "done" && item.ai_summary ? (
          // Everything AI-generated lives inside AIInsightBadge, cooler and
          // more neutral than the warm "What was I thinking?" block below —
          // the two must never be confusable (Section 4, 14).
          <AIInsightBadge>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.ai_category && <CategoryBadge category={item.ai_category} />}
              {tags
                .filter((t) => t.source === "ai")
                .map((t) => (
                  <Tag key={t.name} name={t.name} />
                ))}
            </div>
            <p className="mt-2">{item.ai_summary}</p>
            {item.ai_content && item.ai_content !== item.ai_summary && (
              <details className="mt-3 rounded-lg border border-border/60 bg-bg-1/50 px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-text-secondary">What Recall understood</summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{item.ai_content}</p>
              </details>
            )}
            {item.ai_possible_use && (
              <p className="mt-2 text-text-muted">
                <span className="font-medium text-text-secondary">Possible use: </span>
                {item.ai_possible_use}
              </p>
            )}
          </AIInsightBadge>
        ) : null}

        <div className="mt-2">
          <TagEditor
            itemId={item.id}
            initialTags={tags.filter((t) => t.source === "user").map((t) => t.name)}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
          >
            <RefreshCw size={12} className={reanalyzing ? "animate-spin" : ""} />
            {reanalyzing ? "Analyzing…" : "Re-analyze with AI"}
          </button>
          {reanalyzeError && <span className="text-xs text-text-muted">{reanalyzeError}</span>}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-y border-border-subtle py-3">
        <AnimatedButton
          variant={isFavorite ? "primary" : "secondary"}
          size="sm"
          onClick={handleToggleFavorite}
        >
          <Star size={14} className={cn(isFavorite && "fill-current")} />
          {isFavorite ? "Favorited" : "Favorite"}
        </AnimatedButton>
        <AnimatedButton variant="secondary" size="sm" onClick={handleToggleArchive}>
          {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
          {isArchived ? "Restore" : "Archive"}
        </AnimatedButton>
        <AnimatedButton variant="secondary" size="sm" onClick={handleTurnIntoTask}>
          <CheckSquare size={14} />
          {taskCreated ? "Task created ✓" : "Turn into task"}
        </AnimatedButton>
        <AnimatedButton variant="ghost" size="sm" onClick={handleDelete} className="ml-auto text-danger">
          <Trash2 size={14} />
          {confirmingDelete ? "Click again to confirm" : "Delete"}
        </AnimatedButton>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FolderInput size={14} className="text-text-muted" />
          <select
            value={collectionId ?? ""}
            onChange={(e) => handleCollectionChange(e.target.value || null)}
            className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || "📁"} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Target size={14} className="text-text-muted" />
          <select
            value={projectId ?? ""}
            onChange={(e) => handleProjectChange(e.target.value || null)}
            className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-text-secondary">Why did you save this?</p>
        <ReasonSelector value={reasonTag} onChange={setReasonTag} />
      </div>

      <div className="mt-4">
        <WhatWasIThinkingInput
          id="detail-note"
          rows={4}
          placeholder="What was I thinking?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {dirty && (
        <div className="mt-3 flex justify-end">
          <AnimatedButton size="sm" onClick={handleSaveContext} disabled={saving}>
            {saving ? "Saving…" : savedRecently ? "Saved ✓" : "Save changes"}
          </AnimatedButton>
        </div>
      )}
    </div>
  );
}
