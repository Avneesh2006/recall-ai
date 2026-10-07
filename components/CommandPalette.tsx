"use client";

import { ContentTypeGlyph } from "@/components/Badges";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import type { SavedItem } from "@/types/database";
import { Command } from "cmdk";
import {
  CheckSquare,
  FolderOpen,
  History,
  Home,
  LibraryBig,
  MessageCircleQuestion,
  Plus,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavCommand {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Library", href: "/app/library", icon: LibraryBig },
  { label: "Timeline", href: "/app/timeline", icon: History },
  { label: "Collections", href: "/app/collections", icon: FolderOpen },
  { label: "Projects", href: "/app/projects", icon: Target },
  { label: "Tasks", href: "/app/tasks", icon: CheckSquare },
  { label: "Search", href: "/app/search", icon: Search },
  { label: "Ask Recall", href: "/app/ask", icon: MessageCircleQuestion, keywords: "question memory" },
];

const itemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-secondary outline-none data-[selected=true]:bg-bg-3 data-[selected=true]:text-text-primary";
const headingClass =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-muted";

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { open: openSaveDialog } = useSaveDialog();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SavedItem[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMatches([]);
    }
  }, [open]);

  // Live memory matches, debounced (~250ms) and cancelled if the query changes mid-flight.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (!cancelled) setMatches(((json.items ?? []) as SavedItem[]).slice(0, 5));
      } catch {
        if (!cancelled) setMatches([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const q = query.trim();
  const lower = q.toLowerCase();
  const navMatches = NAV_COMMANDS.filter(
    (c) => !lower || `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(lower),
  );
  const showSave = !lower || "save something new note link".includes(lower) || "save".startsWith(lower);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        // Reuses the shared bottom-sheet-on-mobile default (a tall sheet
        // reads fine as a "search sheet" on a phone) and restores the
        // centered popover only at sm+ — every positioning class here is
        // sm:-prefixed on purpose, so it doesn't fight the mobile sheet.
        className="max-h-[90vh] overflow-hidden p-0 sm:top-[20%] sm:max-w-xl sm:translate-y-0"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search your memories, jump to a page, or start saving something.
        </DialogDescription>
        {/* We do our own filtering (live memory matches + page commands), so cmdk's is off. */}
        <Command shouldFilter={false} label="Command palette" loop>
          <div className="flex items-center gap-2 border-b border-border-subtle px-3">
            <Search size={15} className="text-text-muted" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search memories, jump to a page…"
              className="h-12 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>

          <Command.List className={`max-h-[22rem] overflow-y-auto p-1.5 ${headingClass}`}>
            <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
              Nothing matches that.
            </Command.Empty>

            {q.length >= 2 && (
              <Command.Group heading="Find">
                <Command.Item
                  value={`search-${q}`}
                  className={itemClass}
                  onSelect={() => go(`/app/search?q=${encodeURIComponent(q)}`)}
                >
                  <Search size={15} />
                  Search your library for &ldquo;{q}&rdquo;
                </Command.Item>
                <Command.Item
                  value={`ask-${q}`}
                  className={itemClass}
                  onSelect={() => go(`/app/ask?q=${encodeURIComponent(q)}`)}
                >
                  <MessageCircleQuestion size={15} />
                  Ask Recall: &ldquo;{q}&rdquo;
                </Command.Item>
              </Command.Group>
            )}

            {matches.length > 0 && (
              <Command.Group heading="Memories">
                {matches.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`item-${item.id}`}
                    className={itemClass}
                    onSelect={() => go(`/app/item/${item.id}`)}
                  >
                    <ContentTypeGlyph contentType={item.content_type} />
                    <span className="truncate">{item.title || item.url || "Untitled"}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {(showSave || navMatches.length > 0) && (
              <Command.Group heading="Go to">
                {showSave && (
                  <Command.Item
                    value="action-save"
                    className={itemClass}
                    onSelect={() => {
                      onOpenChange(false);
                      // Let this dialog finish closing before the save dialog takes focus.
                      setTimeout(openSaveDialog, 80);
                    }}
                  >
                    <Plus size={15} />
                    Save something
                  </Command.Item>
                )}
                {navMatches.map(({ label, href, icon: Icon }) => (
                  <Command.Item key={href} value={`nav-${href}`} className={itemClass} onSelect={() => go(href)}>
                    <Icon size={15} />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
