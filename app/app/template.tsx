"use client";

import { safeVariants, useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { motion } from "framer-motion";

/**
 * A template (unlike a layout) re-mounts on every navigation, which is
 * what lets each page fade in with a slight vertical shift (Section
 * 7.7). Collapses to a plain fade under prefers-reduced-motion via the
 * central hook. The header lives in the layout, so it stays put while
 * only the page content transitions.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const variants = safeVariants(useReducedMotionSafe());
  return (
    <motion.div initial={variants.initial} animate={variants.animate} transition={variants.transition}>
      {children}
    </motion.div>
  );
}
