import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

/**
 * Translucent layered surface used for overlays, floating panels, and
 * the command palette / save dialog. Solid content surfaces (memory
 * cards, list rows) should use bg-2 directly instead — glass is reserved
 * for things that float above content, not for every card in sight.
 */
export function GlassPanel({ className, elevated, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border backdrop-blur-xl backdrop-saturate-150",
        "bg-bg-2/70",
        elevated ? "shadow-elevated" : "shadow-ambient",
        className,
      )}
      {...props}
    />
  );
}
