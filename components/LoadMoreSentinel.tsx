"use client";

import { useEffect, useRef } from "react";

/**
 * Invisible marker that triggers `onVisible` once it scrolls near the
 * viewport (IntersectionObserver, 200px rootMargin so the next page
 * starts loading just before the user actually hits bottom). Used by
 * Library and Timeline's infinite scroll (Section 20).
 */
export function LoadMoreSentinel({
  onVisible,
  disabled,
}: {
  onVisible: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisible();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, disabled]);

  return <div ref={ref} aria-hidden="true" className="h-1 w-full" />;
}
