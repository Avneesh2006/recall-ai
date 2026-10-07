"use client";

import { MemoryGrid } from "@/components/MemoryGrid";
import { EmptyState } from "@/components/EmptyState";
import { CollectionFormDialog, type CollectionFormValues } from "@/components/CollectionFormDialog";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useSavedItemActions } from "@/hooks/useSavedItemActions";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import type { Collection, Project, SavedItem } from "@/types/database";
import { BackButton } from "@/components/BackButton";
import { Pencil, Trash2, LibraryBig } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CollectionDetailView({
  collection,
  initialItems,
  allCollections,
}: {
  collection: Collection;
  initialItems: SavedItem[];
  allCollections: Collection[];
}) {
  const router = useRouter();
  const { open } = useSaveDialog();
  const {
    items,
    toggleFavorite,
    toggleArchive,
    remove,
    editTitle,
    moveToCollection,
    moveToProject,
    turnIntoTask,
    similarCounts,
  } = useSavedItemActions(initialItems);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState(collection);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((json) => setProjects(json.projects ?? []))
      .catch(() => {});
  }, []);

  async function handleEditSubmit(values: CollectionFormValues): Promise<string | void> {
    const res = await fetch(`/api/collections/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) return json.error ?? "Couldn't save changes.";
    setCurrent(json.collection);
  }

  async function handleDeleteCollection() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await fetch(`/api/collections/${current.id}`, { method: "DELETE" });
    router.push("/app/collections");
  }

  // An item can be moved OUT of this collection from right inside the
  // grid (the card's own "move to collection" menu) — drop it from view
  // immediately rather than waiting for a refetch of the page.
  const visibleItems = items.filter((i) => i.collection_id === current.id);

  return (
    <div>
      <BackButton fallbackHref="/app/collections" label="Collections" />
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{current.icon || "📁"}</span>
            <h1 className="font-display text-3xl text-text-primary">{current.name}</h1>
          </div>
          {current.description && (
            <p className="mt-1 text-text-secondary">{current.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <AnimatedButton variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            Edit
          </AnimatedButton>
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={handleDeleteCollection}
            className="text-danger"
          >
            <Trash2 size={14} />
            {confirmingDelete ? "Click again to confirm" : "Delete"}
          </AnimatedButton>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<LibraryBig size={40} />}
          title="Nothing here yet."
          subtitle="Save something new, or move an existing item here from its card menu in the Library."
          action={<AnimatedButton onClick={open}>+ Save Something</AnimatedButton>}
        />
      ) : (
        <MemoryGrid
          items={visibleItems}
          similarCounts={similarCounts}
          collections={allCollections}
          projects={projects}
          onToggleFavorite={toggleFavorite}
          onToggleArchive={toggleArchive}
          onDelete={remove}
          onEditTitle={editTitle}
          onMoveToCollection={moveToCollection}
          onMoveToProject={moveToProject}
          onTurnIntoTask={turnIntoTask}
        />
      )}

      <CollectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={current}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
