"use client";

import { SaveDialog } from "@/components/SaveDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SaveDialogContextValue {
  open: () => void;
}

const SaveDialogContext = createContext<SaveDialogContextValue | null>(null);

export function useSaveDialog(): SaveDialogContextValue {
  const ctx = useContext(SaveDialogContext);
  if (!ctx) throw new Error("useSaveDialog must be used within SaveDialogProvider");
  return ctx;
}

export function SaveDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deep link: /app?save=1 opens the dialog directly (Section 8).
  useEffect(() => {
    if (searchParams.get("save") === "1") {
      setIsOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete("save");
      router.replace(`${window.location.pathname}${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global keyboard shortcut: "s" opens Save, unless focus is in a field.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (!isTyping && e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SaveDialogContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <SaveDialog open={isOpen} onOpenChange={setIsOpen} />
    </SaveDialogContext.Provider>
  );
}
