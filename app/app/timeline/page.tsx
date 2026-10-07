import { createClient } from "@/lib/supabase/server";
import { listSavedItemsPage } from "@/lib/db/saved-items";
import { TimelineView } from "@/components/TimelineView";

export default async function TimelinePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { items, nextCursor } = await listSavedItemsPage(user!.id);

  return <TimelineView initialItems={items} initialNextCursor={nextCursor} />;
}
