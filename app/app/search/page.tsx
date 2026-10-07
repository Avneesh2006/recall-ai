import { createClient } from "@/lib/supabase/server";
import { searchSavedItems } from "@/lib/db/search";
import { SearchResultsView } from "@/components/SearchResultsView";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialQuery = searchParams.q ?? "";
  const items = await searchSavedItems(user!.id, { query: initialQuery });

  return <SearchResultsView initialQuery={initialQuery} initialItems={items} />;
}
