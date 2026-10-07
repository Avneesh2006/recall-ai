"use client";

import { CollectionGrid } from "@/components/CollectionGrid";
import { CollectionFormDialog, type CollectionFormValues } from "@/components/CollectionFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedButton } from "@/components/AnimatedButton";
import type { Collection } from "@/types/database";
import { FolderPlus, Plus } from "lucide-react";
import { useState } from "react";

export function CollectionsView({
  initialCollections,
  itemCounts,
}: {
  initialCollections: Collection[];
  itemCounts: Record<string, number>;
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
    setDialogOpen(true);
  }

  async function handleSubmit(values: CollectionFormValues): Promise<string | void> {
    if (editing) {
      const res = await fetch(`/api/collections/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't save changes.";
      setCollections((prev) => prev.map((c) => (c.id === editing.id ? json.collection : c)));
    } else {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Couldn't create that collection.";
      setCollections((prev) => [json.collection, ...prev]);
    }
  }

  async function handleDelete(collection: Collection) {
    const previous = collections;
    setCollections((prev) => prev.filter((c) => c.id !== collection.id));
    const res = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
    if (!res.ok) setCollections(previous);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-text-primary">Collections</h1>
        {collections.length > 0 && (
          <AnimatedButton size="sm" onClick={openCreate}>
            <Plus size={15} />
            New collection
          </AnimatedButton>
        )}
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={<FolderPlus size={40} />}
          title="Create your first memory space."
          subtitle="Collections group saved items by project or topic — a simple, predictable 'which folder is this in.'"
          action={<AnimatedButton onClick={openCreate}>+ New Collection</AnimatedButton>}
        />
      ) : (
        <CollectionGrid
          collections={collections}
          itemCounts={itemCounts}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <CollectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
