"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { useSaveDialog } from "@/components/SaveDialogProvider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  FolderOpen,
  History,
  Home,
  LibraryBig,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Plus,
  Search,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MORE_LINKS = [
  { href: "/app/timeline", label: "Timeline", icon: History },
  { href: "/app/ask", label: "Ask Recall", icon: MessageCircleQuestion },
  { href: "/app/collections", label: "Collections", icon: FolderOpen },
  { href: "/app/projects", label: "Projects", icon: Target },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

/**
 * Mobile bottom tab bar (Section 22): Home, Library, a prominent
 * center Save action, Search, and a "More" sheet — the master prompt's
 * own example set ("Home, Library, Save, Timeline/Search, Profile")
 * with the remaining pages (too many for 5 tabs) plus account info
 * folded into More, standing in for "Profile". Hidden at `md` and up,
 * where AppSidebar takes over. `signOutAction` is the actual Server
 * Action from lib/auth/actions, passed down from the layout — kept as a
 * real form submission (not a bare onClick) to match the header's own
 * sign-out, since that's the path already known to work with its
 * internal redirect().
 */
export function BottomTabBar({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const { open: openSave } = useSaveDialog();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabLinkClass = (active: boolean) =>
    cn("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]", active ? "text-accent-text" : "text-text-muted");

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border-subtle bg-bg-1/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden"
        aria-label="Primary"
      >
        <Link href="/app" className={tabLinkClass(pathname === "/app")}>
          <Home size={19} />
          Home
        </Link>
        <Link href="/app/library" className={tabLinkClass(pathname === "/app/library")}>
          <LibraryBig size={19} />
          Library
        </Link>

        <button
          type="button"
          onClick={openSave}
          aria-label="Save something"
          title="Save something (or press S)"
          className="relative -mt-5 flex h-12 w-12 flex-1 items-center justify-center rounded-full bg-accent text-text-onaccent shadow-elevated transition-transform active:scale-95"
        >
          <Plus size={22} />
        </button>

        <Link href="/app/search" className={tabLinkClass(pathname === "/app/search")}>
          <Search size={19} />
          Search
        </Link>

        <button type="button" onClick={() => setMoreOpen(true)} className={tabLinkClass(false)}>
          <Menu size={19} />
          More
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm p-4">
          <DialogTitle className="mb-2 font-display text-lg text-text-primary">More</DialogTitle>
          <div className="flex flex-col gap-1">
            {MORE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-bg-2 hover:text-text-primary"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
            <span className="truncate text-xs text-text-muted">{userEmail}</span>
            <form action={signOutAction}>
              <AnimatedButton variant="ghost" size="sm" type="submit" className="text-danger">
                <LogOut size={14} />
                Log out
              </AnimatedButton>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
