"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Code-split (Section 20): the palette and cmdk only download the first
// time someone actually opens it, not with the initial app bundle.
const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false });

const CommandPaletteContext = createContext<{ toggle: () => void } | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  const toggle = useCallback(() => {
    setEverOpened(true);
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider value={{ toggle }}>
      {children}
      {everOpened && <CommandPalette open={open} onOpenChange={setOpen} />}
    </CommandPaletteContext.Provider>
  );
}

/** Header button that opens the palette and advertises the shortcut. */
export function CommandPaletteTrigger() {
  const { toggle } = useCommandPalette();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open command palette"
      className="hidden items-center gap-2 rounded-md border border-border bg-bg-1 px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-border-accent hover:text-text-secondary md:inline-flex"
    >
      <Search size={13} />
      Quick find
      <kbd className="rounded border border-border px-1 py-px text-[10px]">{isMac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}
