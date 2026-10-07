import { createClient } from "@/lib/supabase/server";
import { getSavedItem, listSameDayItems } from "@/lib/db/saved-items";
import { getItemTags } from "@/lib/db/tags";
import { getRelatedMemories } from "@/lib/db/related";
import { RelatedMemoriesRail } from "@/components/RelatedMemoriesRail";
import { MemoryDetail } from "@/components/MemoryDetail";
import { BackButton } from "@/components/BackButton";
import { SameDayRail } from "@/components/SameDayRail";
import { notFound } from "next/navigation";

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const item = await getSavedItem(params.id);
  if (!item) notFound();

  const [sameDayItems, tags, related] = await Promise.all([
    listSameDayItems(user!.id, item.id, item.saved_at),
    getItemTags(item.id),
    getRelatedMemories(user!.id, item),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton fallbackHref="/app/library" label="Library" />
      <MemoryDetail item={item} tags={tags} />
      <RelatedMemoriesRail itemId={item.id} related={related} />
      <SameDayRail items={sameDayItems} />
    </div>
  );
}
