"use client";

import { useEffect, useState } from "react";

/**
 * Single source of truth for prefers-reduced-motion. Every animated
 * component reads from this hook rather than checking the media query
 * itself, so motion behavior stays consistent app-wide.
 */
export function useReducedMotionSafe() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/** Shared Framer Motion variants that collapse to instant/opacity-only when reduced. */
export function safeVariants(reduced: boolean) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, y: -8 },
    transition: reduced ? { duration: 0.001 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  } as const;
}
