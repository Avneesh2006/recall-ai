"use client";

import { MemoryTimeline } from "@/components/MemoryTimeline";
import { DateRangeFilter, isWithinRange, type DateRangeState } from "@/components/DateRangeFilter";
import { EmptyState } from "@/components/EmptyState";
import { LoadMoreSentinel } from "@/components/LoadMoreSentinel";
import type { SavedItem } from "@/types/database";
import { History } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

export function TimelineView({
  initialItems,
  initialNextCursor,
}: {
  initialItems: SavedItem[];
  initialNextCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [range, setRange] = useState<DateRangeState>({ preset: "all", from: "", to: "" });

  // Section 20: same "load more as needed" pattern as Library, rather
  // than loading the whole history on first paint.
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
  }, [cursor]);

  const visibleItems = useMemo(() => {
    return items
      .filter((i) => !i.is_archived)
      .filter((i) => isWithinRange(i.saved_at, range))
      .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
  }, [items, range]);

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="font-display text-3xl text-text-primary">Timeline</h1>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState
          icon={<History size={40} />}
          title="Nothing in this range."
          subtitle="Try a wider date range, or save something new."
        />
      ) : (
        <>
          <MemoryTimeline items={visibleItems} />
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
