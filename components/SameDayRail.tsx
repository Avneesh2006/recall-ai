import { ContentTypeGlyph } from "@/components/Badges";
import type { SavedItem } from "@/types/database";
import { Clock3 } from "lucide-react";
import Link from "next/link";

/**
 * Memory Thread — see lib/db/saved-items.ts (listSameDayItems) for the
 * reasoning. Shown at the bottom of the Item Detail page.
 */
export function SameDayRail({ items }: { items: SavedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-10 border-t border-border-subtle pt-6">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
        <Clock3 size={13} />
        Also saved that day
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/app/item/${item.id}`}
            className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary"
          >
            <ContentTypeGlyph contentType={item.content_type} />
            <span className="truncate">{item.title || item.url || "Untitled"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
