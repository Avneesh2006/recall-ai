import { createClient } from "@/lib/supabase/server";
import { getRadarPick } from "@/lib/db/saved-items";
import { RecallRadarCard } from "@/components/RecallRadarCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, radarPick] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user!.id).single(),
    getRadarPick(user!.id),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-text-primary">
        Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}.
      </h1>
      <p className="mt-2 max-w-md text-text-secondary">
        Press <kbd className="rounded border border-border bg-bg-2 px-1.5 py-0.5 text-xs">S</kbd>{" "}
        or click &ldquo;Save something&rdquo; above to save a memory, then head to your{" "}
        <Link href="/app/library" className="text-accent-text hover:underline">
          Library
        </Link>
        . Timeline, Tasks, and Ask Recall land in upcoming phases.
      </p>

      {radarPick && (
        <div className="mt-8 max-w-md">
          <RecallRadarCard item={radarPick} />
        </div>
      )}
    </div>
  );
}
