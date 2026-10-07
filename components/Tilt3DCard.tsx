"use client";

import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { motion, useMotionTemplate, useSpring } from "framer-motion";
import { type MouseEvent, type ReactNode, useState } from "react";

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Max rotation in degrees. Spec calls for ~6-8deg. */
  maxTilt?: number;
}

/**
 * Wraps a card/preview surface with a subtle pointer-following tilt,
 * lift, and moving sheen. Do NOT use on data tables, forms, or long
 * text content — cards and previews only (Section 7.5).
 *
 * On touch devices and under prefers-reduced-motion, tilt is disabled
 * and replaced with a simple tap-scale / fade-lift instead.
 */
export function Tilt3DCard({ children, className, style, maxTilt = 7 }: Tilt3DCardProps) {
  const reduced = useReducedMotionSafe();
  const [isTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  );
  const rotateX = useSpring(0, { stiffness: 220, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 220, damping: 18 });
  const lift = useSpring(0, { stiffness: 220, damping: 20 });
  const sheenX = useSpring(50, { stiffness: 220, damping: 24 });

  const disableTilt = reduced || isTouch;

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (disableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * maxTilt * 2);
    rotateX.set((0.5 - py) * maxTilt * 2);
    sheenX.set(px * 100);
    lift.set(-4);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  }

  const sheen = useMotionTemplate`linear-gradient(105deg, transparent 40%, rgba(243,237,226,0.08) ${sheenX}%, transparent 60%)`;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={disableTilt ? { scale: 0.98 } : undefined}
      style={
        disableTilt
          ? style
          : {
              ...style,
              rotateX,
              rotateY,
              y: lift,
              transformPerspective: 800,
            }
      }
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-bg-2 shadow-ambient transition-shadow duration-base hover:shadow-elevated",
        className,
      )}
    >
      {children}
      {!disableTilt && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: sheen }}
        />
      )}
    </motion.div>
  );
}
