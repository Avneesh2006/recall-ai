"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * Plain, ref-forwarding icon button. Spreads all incoming props
 * (including onClick) onto the actual <button> so it works correctly
 * both as a standalone icon button AND as the direct child of a Radix
 * `<Trigger asChild>` — Radix's Slot needs to merge its own onClick,
 * aria attributes, and ref onto the real DOM node, not onto a wrapper.
 * Shared by MemoryCard, CollectionCard, and ProjectCard's hover-action
 * rows rather than redefined per file.
 */
export const IconActionButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ children, label, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg-2/90 text-text-secondary backdrop-blur transition-colors hover:bg-bg-3 hover:text-text-primary",
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconActionButton.displayName = "IconActionButton";
