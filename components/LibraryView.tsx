"use client";

import { MemoryGrid } from "@/components/MemoryGrid";
import { LibraryFilters, type LibraryFilterState } from "@/components/LibraryFilters";
import { EmptyState } from "@/components/EmptyState";
import { LoadMoreSentinel } from "@/components/LoadMoreSentinel";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useSavedItemActions } from "@/hooks/useSavedItemActions";
import type { Collection, Project, SavedItem } from "@/types/database";
import { LibraryBig } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function LibraryView({
  initialItems,
  initialNextCursor,
}: {
  initialItems: SavedItem[];
  initialNextCursor: string | null;
}) {
  const {
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
  } = useSavedItemActions(initialItems);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<LibraryFilterState>({
    query: "",
    type: "all",
    state: "active",
    sort: "newest",
  });
  const { open } = useSaveDialog();

  // Section 20: load more as the user scrolls rather than fetching the
  // whole library up front. Filters apply to whatever's loaded so far —
  // scrolling to load more naturally surfaces more filtered matches too.
  const [cursor, setCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/items?cursor=${encodeURIComponent(cursor)}`);
      const json = await res.json();
      setItems((prev) => [...prev, ...(json.items ?? [])]);
      setCursor(json.nextCursor ?? null);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor, setItems]);

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

  function handleFindSimilar(item: SavedItem) {
    setFilters((prev) => ({ ...prev, query: item.source_domain ?? "" }));
  }

  const visibleItems = useMemo(() => {
    let result = items;

    if (filters.state === "favorites") result = result.filter((i) => i.is_favorite && !i.is_archived);
    else if (filters.state === "archived") result = result.filter((i) => i.is_archived);
    else result = result.filter((i) => !i.is_archived);

    if (filters.type !== "all") result = result.filter((i) => i.input_type === filters.type);

    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.what_was_i_thinking?.toLowerCase().includes(q) ||
          i.source_domain?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      const diff = new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
      return filters.sort === "newest" ? -diff : diff;
    });

    return result;
  }, [items, filters]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<LibraryBig size={40} />}
        title="Your memory is empty."
        subtitle="Start saving the things you don't want to forget."
        action={<AnimatedButton onClick={open}>+ Save Something</AnimatedButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <LibraryFilters filters={filters} onChange={setFilters} />
      <p role="status" aria-live="polite" className="sr-only">
        {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"} shown
      </p>
      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<LibraryBig size={40} />}
          title="We couldn't find that memory."
          subtitle="Try a different search or filter."
        />
      ) : (
        <>
          <MemoryGrid
            items={visibleItems}
            similarCounts={similarCounts}
            collections={collections}
            projects={projects}
            onToggleFavorite={toggleFavorite}
            onToggleArchive={toggleArchive}
            onDelete={remove}
            onEditTitle={editTitle}
            onFindSimilar={handleFindSimilar}
            onMoveToCollection={moveToCollection}
            onMoveToProject={moveToProject}
            onTurnIntoTask={turnIntoTask}
          />
          {cursor && <LoadMoreSentinel onVisible={loadMore} disabled={loadingMore} />}
          {loadingMore && (
            <p role="status" aria-live="polite" className="py-4 text-center text-xs text-text-muted">
              Loading more…
            </p>
          )}
        </>
      )}
    </div>
  );
}
