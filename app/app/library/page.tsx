import { createClient } from "@/lib/supabase/server";
import { listSavedItemsPage } from "@/lib/db/saved-items";
import { LibraryView } from "@/components/LibraryView";

export default async function LibraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { items, nextCursor } = await listSavedItemsPage(user!.id);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-text-primary">Library</h1>
      <LibraryView initialItems={items} initialNextCursor={nextCursor} />
    </div>
  );
}
