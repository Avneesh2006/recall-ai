"use client";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { InputType } from "@/types/database";
import { Search } from "lucide-react";

export type StateFilter = "active" | "favorites" | "archived";
export type SortOrder = "newest" | "oldest";

export interface LibraryFilterState {
  query: string;
  type: InputType | "all";
  state: StateFilter;
  sort: SortOrder;
}

const TYPE_OPTIONS: { value: InputType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "url", label: "Links" },
  { value: "note", label: "Notes" },
  { value: "image", label: "Images" },
  { value: "file", label: "Files" },
];

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "favorites", label: "Favorites" },
  { value: "archived", label: "Archived" },
];

export function LibraryFilters({
  filters,
  onChange,
}: {
  filters: LibraryFilterState;
  onChange: (next: LibraryFilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search your library…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-bg-1 p-1">
          {STATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, state: opt.value })}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                filters.state === opt.value
                  ? "bg-bg-3 text-text-primary"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as InputType | "all" })}
          className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOrder })}
          className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
    </div>
  );
}
