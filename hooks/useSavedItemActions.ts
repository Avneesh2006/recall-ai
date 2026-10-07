"use client";

import { useToast } from "@/components/ToastProvider";
import type { SavedItem } from "@/types/database";
import { useMemo, useState } from "react";

async function patchItem(id: string, patch: Partial<SavedItem>) {
  const res = await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Update failed");
}

/**
 * Optimistic favorite/archive/delete/rename/move, plus the "similar
 * saves" grouping — shared by every view that renders memory cards.
 *
 * Every write is optimistic; if the request fails (network error OR a
 * non-2xx response) the change is rolled back cleanly and a calm error
 * toast explains it (Section 23) — rather than the UI silently claiming
 * something saved that didn't.
 */
export function useSavedItemActions(initialItems: SavedItem[]) {
  const [items, setItems] = useState(initialItems);
  const { toast } = useToast();

  /** Put one item back to how it was before an optimistic change. */
  function restore(original: SavedItem) {
    setItems((prev) => prev.map((i) => (i.id === original.id ? original : i)));
  }

  function optimisticPatch(item: SavedItem, patch: Partial<SavedItem>, failure: string) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    patchItem(item.id, patch).catch(() => {
      restore(item);
      toast({ message: failure, tone: "error" });
    });
  }

  function toggleFavorite(item: SavedItem) {
    optimisticPatch(item, { is_favorite: !item.is_favorite }, "Couldn't update that favorite.");
  }

  function toggleArchive(item: SavedItem) {
    optimisticPatch(item, { is_archived: !item.is_archived }, "Couldn't update that archive.");
  }

  function remove(item: SavedItem) {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    fetch(`/api/items/${item.id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
      })
      .catch(() => {
        setItems(previous);
        toast({ message: "Couldn't delete that.", tone: "error" });
      });
  }

  function editTitle(item: SavedItem, newTitle: string) {
    optimisticPatch(item, { title: newTitle }, "Couldn't rename that.");
  }

  function moveToCollection(item: SavedItem, collectionId: string | null) {
    optimisticPatch(item, { collection_id: collectionId }, "Couldn't move that.");
  }

  function moveToProject(item: SavedItem, projectId: string | null) {
    optimisticPatch(item, { project_id: projectId }, "Couldn't move that.");
  }

  function turnIntoTask(item: SavedItem) {
    // Doesn't change the item itself, so nothing to roll back — just confirm.
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title || item.url || "Untitled task",
        saved_item_id: item.id,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Task failed");
        toast({ message: "Task created", href: "/app/tasks", actionLabel: "View" });
      })
      .catch(() => toast({ message: "Couldn't create that task.", tone: "error" }));
  }

  // "Similar saves" — see DECISIONS.md. Grouped by domain, or by content
  // type when there's no domain (notes, uploads).
  const similarCounts = useMemo(() => {
    const groups = new Map<string, string[]>();
    const keyFor = (i: SavedItem) =>
      i.source_domain ? `domain:${i.source_domain}` : `type:${i.content_type ?? i.input_type}`;

    for (const i of items) {
      if (i.is_archived) continue;
      const key = keyFor(i);
      groups.set(key, [...(groups.get(key) ?? []), i.id]);
    }

    const counts = new Map<string, number>();
    for (const i of items) {
      const count = (groups.get(keyFor(i))?.length ?? 1) - 1;
      if (count > 0) counts.set(i.id, count);
    }
    return counts;
  }, [items]);

  return {
    items,
    setItems,
    toggleFavorite,
    toggleArchive,
    remove,
    editTitle,
    moveToCollection,
    moveToProject,
    turnIntoTask,
    similarCounts,
  };
}
