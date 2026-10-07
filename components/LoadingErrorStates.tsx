import { AnimatedButton } from "@/components/AnimatedButton";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-20 text-sm text-text-muted"
    >
      <span className="shimmer-text">{label}</span>
    </div>
  );
}

export function ErrorState({
  message = "Something didn't load.",
  onRetry,
  children,
}: {
  message?: string;
  onRetry?: () => void;
  /** Optional custom action, e.g. a link to a fallback. */
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/25 bg-danger/5 px-6 py-16 text-center"
    >
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <AnimatedButton variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </AnimatedButton>
      )}
      {children}
    </div>
  );
}
