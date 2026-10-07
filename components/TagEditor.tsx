"use client";

import { useToast } from "@/components/ToastProvider";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";

/**
 * The person's own tags (source = 'user'). Chips pop in when added and
 * shrink-and-fade out when removed (Section 7.6) — never just appear or
 * vanish. Adds and removes are optimistic and roll back with a toast on
 * failure.
 */
export function TagEditor({ itemId, initialTags }: { itemId: string; initialTags: string[] }) {
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const reduced = useReducedMotionSafe();
  const { toast } = useToast();

  async function addTag() {
    const name = draft.trim().toLowerCase().slice(0, 40);
    setDraft("");
    if (!name || tags.includes(name)) return;

    setTags((prev) => [...prev, name]);
    try {
      const res = await fetch(`/api/items/${itemId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("add failed");
    } catch {
      setTags((prev) => prev.filter((t) => t !== name));
      toast({ message: "Couldn't add that tag.", tone: "error" });
    }
  }

  async function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
    try {
      const res = await fetch(`/api/items/${itemId}/tags?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("remove failed");
    } catch {
      setTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
      toast({ message: "Couldn't remove that tag.", tone: "error" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <AnimatePresence initial={false}>
        {tags.map((name) => (
          <motion.span
            key={name}
            layout={!reduced}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-text-secondary"
          >
            {name}
            <button
              type="button"
              onClick={() => removeTag(name)}
              aria-label={`Remove tag ${name}`}
              className="text-text-muted transition-colors hover:text-danger"
            >
              <X size={10} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <label className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Plus size={11} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              void addTag();
            }
          }}
          onBlur={() => draft.trim() && void addTag()}
          placeholder="Add tag"
          maxLength={40}
          aria-label="Add a tag"
          className="w-20 bg-transparent text-[11px] text-text-primary outline-none placeholder:text-text-muted focus:w-28"
        />
      </label>
    </div>
  );
}
