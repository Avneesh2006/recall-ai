import { createClient } from "@/lib/supabase/server";
import { getCollection, listCollections } from "@/lib/db/collections";
import { listSavedItemsByCollection } from "@/lib/db/saved-items";
import { CollectionDetailView } from "@/components/CollectionDetailView";
import { notFound } from "next/navigation";

export default async function CollectionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const collection = await getCollection(params.id);
  if (!collection) notFound();

  const [items, allCollections] = await Promise.all([
    listSavedItemsByCollection(user!.id, params.id),
    listCollections(user!.id),
  ]);

  return (
    <CollectionDetailView collection={collection} initialItems={items} allCollections={allCollections} />
  );
}
