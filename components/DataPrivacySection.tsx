"use client";

import { AnimatedButton } from "@/components/AnimatedButton";
import { FormError } from "@/components/FormError";
import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Settings → Data & Privacy (Section 27): export (JSON/CSV) and account deletion. */
export function DataPrivacySection() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Couldn't delete your account.");
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete your account.");
      setDeleting(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-1 font-display text-lg text-text-primary">Data &amp; Privacy</h2>
      <p className="mb-3 text-sm text-text-secondary">
        Everything you&apos;ve saved belongs to you — export it any time, or delete your account and
        everything in it permanently.
      </p>

      <div className="flex flex-wrap gap-2">
        <a href="/api/export?format=json" download>
          <AnimatedButton variant="secondary" size="sm">
            <Download size={14} />
            Export as JSON
          </AnimatedButton>
        </a>
        <a href="/api/export?format=csv" download>
          <AnimatedButton variant="secondary" size="sm">
            <Download size={14} />
            Export as CSV
          </AnimatedButton>
        </a>
      </div>

      <div className="border-danger/30 bg-danger/5 mt-6 rounded-lg border p-4">
        <p className="text-sm font-medium text-danger">Delete account</p>
        <p className="mt-1 text-sm text-text-secondary">
          Permanently deletes every saved item, collection, project, task, and file you&apos;ve
          uploaded. This cannot be undone. Type <strong>DELETE</strong> to confirm.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="h-9 w-32 rounded-md border border-border bg-bg-1 px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <AnimatedButton
            variant="danger"
            size="sm"
            disabled={confirmText !== "DELETE" || deleting}
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            {deleting ? "Deleting…" : "Delete my account"}
          </AnimatedButton>
        </div>
        <FormError message={error ?? undefined} />
      </div>
    </section>
  );
}
