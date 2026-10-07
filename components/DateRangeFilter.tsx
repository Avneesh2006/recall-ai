"use client";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type DateRangePreset = "all" | "today" | "week" | "month" | "custom";

export interface DateRangeState {
  preset: DateRangePreset;
  from: string; // YYYY-MM-DD, only used when preset === "custom"
  to: string;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
];

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeState;
  onChange: (next: DateRangeState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-md bg-bg-1 p-1">
        {PRESETS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...value, preset: opt.value })}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              value.preset === opt.value
                ? "bg-bg-3 text-text-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="w-36"
          />
          <span className="text-xs text-text-muted">to</span>
          <Input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="w-36"
          />
        </div>
      )}
    </div>
  );
}

/** Applies a DateRangeState to a saved_at ISO timestamp. */
export function isWithinRange(savedAtIso: string, range: DateRangeState): boolean {
  if (range.preset === "all") return true;

  const savedAt = new Date(savedAtIso);
  const now = new Date();

  if (range.preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return savedAt >= start;
  }
  if (range.preset === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return savedAt >= start;
  }
  if (range.preset === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return savedAt >= start;
  }
  // custom
  if (range.from && savedAt < new Date(range.from + "T00:00:00")) return false;
  if (range.to && savedAt > new Date(range.to + "T23:59:59")) return false;
  return true;
}
