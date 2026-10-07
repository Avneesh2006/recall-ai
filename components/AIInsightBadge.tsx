import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Wraps any AI-generated content (category, summary, possible-use).
 * Deliberately cooler/neutral vs. WhatWasIThinking's warm amber styling
 * — the two must never be visually confusable (Section 4, 9, 14).
 */
export function AIInsightBadge({ children, label = "AI suggestion" }: { children: ReactNode; label?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-1 p-3">
      <span className="inline-flex items-center gap-1 rounded-full bg-bg-3 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
        <Sparkles size={11} className="text-text-muted" />
        {label}
      </span>
      <div className="mt-1.5 text-sm text-text-secondary">{children}</div>
    </div>
  );
}

export function AIPendingNote({ className }: { className?: string }) {
  return (
    <p className={cn("shimmer-text text-xs", className)}>organizing…</p>
  );
}

export function AIUnavailableNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-text-muted", className)}>AI organizing unavailable right now</p>
  );
}
