import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

/**
 * The "why did I save this" field. First-class and visually prominent
 * per Section 4 — warm, personal, quote-like styling that's always
 * distinguishable from AI-generated content (see AIInsightBadge).
 */
export function WhatWasIThinkingInput({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="rounded-lg border border-accent/25 bg-accent/[0.06] p-4">
      <label htmlFor={props.id} className="text-sm font-medium text-accent-text">
        What was I thinking?
      </label>
      <textarea
        {...props}
        className={cn(
          "mt-2 w-full resize-none border-0 bg-transparent text-sm italic leading-relaxed text-text-primary",
          "placeholder:text-text-muted placeholder:not-italic",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded",
          className,
        )}
        rows={props.rows ?? 3}
      />
    </div>
  );
}

/** Read-only display version — used in memory cards, detail, search, Ask Recall. */
export function WhatWasIThinkingDisplay({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-accent/25 bg-accent/[0.06] p-4">
      <p className="text-xs font-medium text-accent-text">What was I thinking?</p>
      <p className="mt-1 text-sm italic leading-relaxed text-text-primary">&ldquo;{text}&rdquo;</p>
    </div>
  );
}
