"use client";

import { cn } from "@/lib/utils";
import { buttonStyles } from "@/lib/button-styles";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from "react";


interface AnimatedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant, size, children, onMouseMove, onMouseLeave, ...props }, ref) => {
    const reduced = useReducedMotionSafe();
    const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });
    const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 });

    function handleMouseMove(e: MouseEvent<HTMLButtonElement>) {
      if (!reduced) {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
      }
      onMouseMove?.(e);
    }

    function handleMouseLeave(e: MouseEvent<HTMLButtonElement>) {
      x.set(0);
      y.set(0);
      onMouseLeave?.(e);
    }

    return (
      <motion.button
        ref={ref}
        style={reduced ? undefined : { x, y }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          buttonStyles({ variant, size }),
          variant === "primary" && "hover:shadow-glow",
          className,
        )}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  },
);
AnimatedButton.displayName = "AnimatedButton";
