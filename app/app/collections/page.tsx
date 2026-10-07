import { createClient } from "@/lib/supabase/server";
import { listCollections } from "@/lib/db/collections";
import { getCollectionItemCounts } from "@/lib/db/saved-items";
import { CollectionsView } from "@/components/CollectionsView";

export default async function CollectionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [collections, itemCounts] = await Promise.all([
    listCollections(user!.id),
    getCollectionItemCounts(user!.id),
  ]);

  return <CollectionsView initialCollections={collections} itemCounts={itemCounts} />;
}
