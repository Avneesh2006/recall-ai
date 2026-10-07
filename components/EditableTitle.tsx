"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function EditableTitle({
  title,
  fallback,
  onCommit,
  as: Tag = "h3",
  className = "mt-1 line-clamp-2 cursor-text font-display text-base text-text-primary transition-colors hover:text-accent-text/90",
  inputClassName = "mt-1 w-full rounded border border-accent bg-bg-1 px-1.5 py-0.5 font-display text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
}: {
  title: string | null;
  fallback: string;
  onCommit: (newTitle: string) => void;
  as?: "h1" | "h3";
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setValue(title ?? "");
  }, [title]);

  function commit() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === (title ?? "")) {
      setValue(title ?? "");
      return;
    }
    onCommit(trimmed);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setValue(title ?? "");
            setEditing(false);
          }
        }}
        onBlur={commit}
        maxLength={200}
        className={inputClassName}
      />
    );
  }

  function startEditing(e: { preventDefault: () => void; stopPropagation: () => void }) {
    // May be wrapped in a <Link> (the card) — stop navigation and edit instead.
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
  }

  return (
    <Tag
      // Not a native button (it's an h1/h3 for correct document structure),
      // so it needs role/tabIndex/onKeyDown by hand to be keyboard-operable
      // at all — previously this was a click-only target, completely
      // unreachable without a mouse (Section 21).
      role="button"
      tabIndex={0}
      aria-label={`Rename "${value || fallback}"`}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") startEditing(e);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title="Click to rename"
      className={cn("cursor-text", className)}
    >
      {value || fallback}
    </Tag>
  );
}
