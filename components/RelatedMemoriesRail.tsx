"use client";

import { AIInsightBadge } from "@/components/AIInsightBadge";
import { ContentTypeGlyph } from "@/components/Badges";
import type { RelatedMemory } from "@/lib/db/related";
import type { SavedItem } from "@/types/database";
import { Link2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type AiState = "idle" | "loading" | "done" | "unavailable";

/**
 * Related Memories (Section 9). The main list is structural overlap
 * (collection/project/tags/category/source) and always shows why. The
 * AI pass is a separate, explicit button and is always labeled as AI.
 */
export function RelatedMemoriesRail({
  itemId,
  related,
}: {
  itemId: string;
  related: RelatedMemory[];
}) {
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiItems, setAiItems] = useState<SavedItem[]>([]);

  const shownIds = new Set(related.map((r) => r.item.id));

  async function lookDeeper() {
    setAiState("loading");
    try {
      const res = await fetch("/api/ai/related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("unavailable");
      const json = await res.json();
      setAiItems(((json.items ?? []) as SavedItem[]).filter((i) => !shownIds.has(i.id)));
      setAiState("done");
    } catch {
      setAiState("unavailable");
    }
  }

  return (
    <div className="mt-10 border-t border-border-subtle pt-6">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
        <Link2 size={13} />
        Related memories
      </p>

      {related.length > 0 ? (
        <div className="flex flex-col gap-2">
          {related.map(({ item, reasons }) => (
            <Link
              key={item.id}
              href={`/app/item/${item.id}`}
              className="rounded-md border border-border-subtle px-3 py-2 transition-colors hover:border-border-accent"
            >
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <ContentTypeGlyph contentType={item.content_type} />
                <span className="truncate">{item.title || item.url || "Untitled"}</span>
              </span>
              <span className="mt-0.5 block text-xs text-text-muted">{reasons.join(" · ")}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Nothing shares a collection, project, or tag with this yet.</p>
      )}

      <div className="mt-3">
        {aiState === "idle" && (
          <button
            type="button"
            onClick={lookDeeper}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <Sparkles size={12} />
            Look deeper with AI
          </button>
        )}
        {aiState === "loading" && <p className="shimmer-text text-xs">looking…</p>}
        {aiState === "unavailable" && (
          <p className="text-xs text-text-muted">AI suggestions are unavailable right now.</p>
        )}
        {aiState === "done" &&
          (aiItems.length === 0 ? (
            <p className="text-xs text-text-muted">The AI didn&apos;t find anything else that clearly relates.</p>
          ) : (
            <AIInsightBadge>
              <div className="flex flex-col gap-1.5">
                {aiItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/app/item/${item.id}`}
                    className="flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <ContentTypeGlyph contentType={item.content_type} />
                    <span className="truncate">{item.title || item.url || "Untitled"}</span>
                  </Link>
                ))}
              </div>
            </AIInsightBadge>
          ))}
      </div>
    </div>
  );
}
