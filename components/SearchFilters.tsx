"use client";

import { DateRangeFilter, type DateRangeState } from "@/components/DateRangeFilter";
import type { Collection, InputType, Project } from "@/types/database";
import { cn } from "@/lib/utils";

export interface SearchFilterState {
  type: InputType | "all";
  collectionId: string | null;
  projectId: string | null;
  favoritesOnly: boolean;
  includeArchived: boolean;
  range: DateRangeState;
}

const TYPE_OPTIONS: { value: InputType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "url", label: "Links" },
  { value: "note", label: "Notes" },
  { value: "image", label: "Images" },
  { value: "file", label: "Files" },
];

export function SearchFilters({
  value,
  collections,
  projects,
  onChange,
}: {
  value: SearchFilterState;
  collections: Collection[];
  projects: Project[];
  onChange: (next: SearchFilterState) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <DateRangeFilter value={value.range} onChange={(range) => onChange({ ...value, range })} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as InputType | "all" })}
          className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {collections.length > 0 && (
          <select
            value={value.collectionId ?? ""}
            onChange={(e) => onChange({ ...value, collectionId: e.target.value || null })}
            className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="">Any collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || "📁"} {c.name}
              </option>
            ))}
          </select>
        )}

        {projects.length > 0 && (
          <select
            value={value.projectId ?? ""}
            onChange={(e) => onChange({ ...value, projectId: e.target.value || null })}
            className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="">Any project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => onChange({ ...value, favoritesOnly: !value.favoritesOnly })}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value.favoritesOnly
              ? "border-accent bg-accent/15 text-accent-text"
              : "border-border text-text-secondary hover:border-border-accent",
          )}
        >
          Favorites only
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...value, includeArchived: !value.includeArchived })}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            value.includeArchived
              ? "border-accent bg-accent/15 text-accent-text"
              : "border-border text-text-secondary hover:border-border-accent",
          )}
        >
          Include archived
        </button>
      </div>
    </div>
  );
}
