"use client";

import { cn } from "@/lib/utils";
import {
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  History,
  Home,
  LibraryBig,
  MessageCircleQuestion,
  Search,
  Settings,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/library", label: "Library", icon: LibraryBig },
  { href: "/app/timeline", label: "Timeline", icon: History },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/ask", label: "Ask Recall", icon: MessageCircleQuestion },
  { href: "/app/collections", label: "Collections", icon: FolderOpen },
  { href: "/app/projects", label: "Projects", icon: Target },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "recall-sidebar-collapsed";

/**
 * Persistent desktop sidebar (Section 22). Collapsible to an icon-only
 * rail — the "tablet: condensed grid, collapsible sidebar" requirement —
 * via a toggle the user controls directly rather than an automatic
 * breakpoint switch, so the choice persists across sessions
 * (localStorage) instead of being re-decided by window width on every
 * visit. Hidden entirely below `md`; BottomTabBar takes over there.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border-subtle bg-bg-1/50 transition-[width] duration-base md:flex",
        collapsed ? "w-16" : "w-56",
        // Avoid a flash of the wrong width before localStorage is read on mount.
        !hydrated && "invisible",
      )}
    >
      <Link href="/app" className="flex items-center gap-2 px-4 py-4 font-display text-lg text-text-primary">
        <span className="text-accent-text" aria-hidden="true">
          ●
        </span>
        {!collapsed && "Recall"}
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-bg-3 text-text-primary"
                  : "text-text-secondary hover:bg-bg-2 hover:text-text-primary",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mx-2 mb-3 flex items-center justify-center rounded-md border border-border-subtle py-1.5 text-text-muted transition-colors hover:text-text-secondary"
      >
        {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
      </button>
    </aside>
  );
}
