"use client";

import { SearchBar } from "@/components/SearchBar";
import { SearchFilters, type SearchFilterState } from "@/components/SearchFilters";
import { MemoryGrid } from "@/components/MemoryGrid";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingErrorStates";
import { useSavedItemActions } from "@/hooks/useSavedItemActions";
import type { Collection, Project, SavedItem } from "@/types/database";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DEFAULT_FILTERS: SearchFilterState = {
  type: "all",
  collectionId: null,
  projectId: null,
  favoritesOnly: false,
  includeArchived: false,
  range: { preset: "all", from: "", to: "" },
};

function buildQueryString(query: string, filters: SearchFilterState): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.collectionId) params.set("collection_id", filters.collectionId);
  if (filters.projectId) params.set("project_id", filters.projectId);
  if (filters.favoritesOnly) params.set("favorites", "1");
  if (filters.includeArchived) params.set("archived", "1");
  if (filters.range.preset !== "all") {
    params.set("range", filters.range.preset);
    if (filters.range.preset === "custom") {
      if (filters.range.from) params.set("from", filters.range.from);
      if (filters.range.to) params.set("to", filters.range.to);
    }
  }
  return params.toString();
}

function rangeToDates(range: SearchFilterState["range"]): { from?: string; to?: string } {
  if (range.preset === "all") return {};
  if (range.preset === "custom") return { from: range.from || undefined, to: range.to || undefined };
  const now = new Date();
  if (range.preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  if (range.preset === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { from: start.toISOString() };
  }
  const start = new Date(now);
  start.setMonth(start.getMonth() - 1);
  return { from: start.toISOString() };
}

export function SearchResultsView({ initialQuery, initialItems }: { initialQuery: string; initialItems: SavedItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilterState>(DEFAULT_FILTERS);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const hasSearched = useRef(false);

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

  useEffect(() => {
    fetch("/api/collections").then((r) => r.json()).then((j) => setCollections(j.collections ?? [])).catch(() => {});
    fetch("/api/projects").then((r) => r.json()).then((j) => setProjects(j.projects ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    // Skip the redundant fetch on first mount — the server already
    // loaded the initial result set for the URL's ?q= before this
    // component ever rendered.
    if (!hasSearched.current) {
      hasSearched.current = true;
      return;
    }

    const qs = buildQueryString(query, filters);
    router.replace(`/app/search${qs ? `?${qs}` : ""}`, { scroll: false });

    setLoading(true);
    const { from, to } = rangeToDates(filters.range);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.collectionId) params.set("collection_id", filters.collectionId);
    if (filters.projectId) params.set("project_id", filters.projectId);
    if (filters.favoritesOnly) params.set("favorites", "1");
    if (filters.includeArchived) params.set("archived", "1");
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setItems(json.items ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters]);

  const hasQueryOrFilters =
    query.trim() ||
    filters.type !== "all" ||
    filters.collectionId ||
    filters.projectId ||
    filters.favoritesOnly ||
    filters.includeArchived ||
    filters.range.preset !== "all";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-4 font-display text-3xl text-text-primary">Search</h1>
        <SearchBar value={query} onChange={setQuery} autoFocus placeholder="Search titles, notes, why you saved it…" />
        <div className="mt-3">
          <SearchFilters value={filters} collections={collections} projects={projects} onChange={setFilters} />
        </div>
      </div>

      {/* Visually hidden — announces the result count once a search
          finishes (Section 21's own example: "search results count
          changes"). Only rendered when not loading: LoadingState below
          already has its own aria-live region for "Searching…" — both
          firing at once would double-announce the same moment. */}
      {!loading && (
        <p role="status" aria-live="polite" className="sr-only">
          {items.length} result{items.length === 1 ? "" : "s"} found
        </p>
      )}

      {loading ? (
        <LoadingState label="Searching…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={40} />}
          title={hasQueryOrFilters ? "We couldn't find that memory." : "Search your whole library."}
          subtitle={
            hasQueryOrFilters
              ? "Try different words, or widen your filters."
              : "Search across titles, notes, your \"what was I thinking\" text, and more."
          }
        />
      ) : (
        <MemoryGrid
          items={items}
          similarCounts={similarCounts}
          collections={collections}
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
    </div>
  );
}
