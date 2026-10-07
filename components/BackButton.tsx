"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Back button for detail/inner pages (Memory, Collection, Project
 * detail). Uses real browser history when the page was actually reached
 * by navigating within the app (so "back" lands where the person
 * expects), falling back to `fallbackHref` when there's no in-app
 * history to go back to — e.g. the page was opened directly via a
 * bookmark, a shared link, or a new tab, where router.back() would
 * leave the app entirely or do nothing.
 */
export function BackButton({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const router = useRouter();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Same-origin referrer is the one reliable-enough signal that
    // history.back() will land back inside this app rather than, say,
    // closing to a blank tab or leaving to an external site.
    setHasHistory(
      typeof window !== "undefined" &&
        document.referrer.startsWith(window.location.origin) &&
        window.history.length > 1,
    );
  }, []);

  return (
    <button
      type="button"
      onClick={() => (hasHistory ? router.back() : router.push(fallbackHref))}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
    >
      <ArrowLeft size={15} />
      {label}
    </button>
  );
}
