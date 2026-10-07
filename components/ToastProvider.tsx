"use client";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ToastInput {
  message: string;
  /** Optional follow-up link, e.g. "View" after saving. */
  href?: string;
  actionLabel?: string;
  tone?: "default" | "error";
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const reduced = useReducedMotionSafe();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { ...input, id }]); // at most 3 on screen
      setTimeout(() => dismiss(id), input.tone === "error" ? 5000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* aria-live so screen readers announce confirmations and errors (Section 21). */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-center justify-between gap-3 rounded-lg border bg-bg-3/95 px-4 py-2.5 text-sm shadow-elevated backdrop-blur-xl",
                t.tone === "error" ? "border-danger/40 text-text-primary" : "border-border text-text-primary",
              )}
            >
              <span>{t.message}</span>
              {t.href && (
                <Link
                  href={t.href}
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-xs font-medium text-accent-text hover:underline"
                >
                  {t.actionLabel ?? "View"}
                </Link>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
