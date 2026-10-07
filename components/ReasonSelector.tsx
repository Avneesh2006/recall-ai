"use client";

import { cn } from "@/lib/utils";
import { REASON_TAGS, type ReasonTag } from "@/types/database";
import { motion } from "framer-motion";

export function ReasonSelector({
  value,
  onChange,
}: {
  value: ReasonTag | null;
  onChange: (tag: ReasonTag | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Why are you saving this?">
      {REASON_TAGS.map((tag) => {
        const selected = value === tag.value;
        return (
          <motion.button
            key={tag.value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(selected ? null : tag.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors duration-fast",
              selected
                ? "border-accent bg-accent/15 text-accent-text"
                : "border-border text-text-secondary hover:border-border-accent hover:text-text-primary",
            )}
          >
            {tag.label}
          </motion.button>
        );
      })}
    </div>
  );
}
