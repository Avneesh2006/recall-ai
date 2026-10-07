import { createClient } from "@/lib/supabase/server";
import type { InputType, SavedItem } from "@/types/database";

export interface SearchParams {
  query?: string;
  type?: InputType | "all";
  collectionId?: string | null;
  projectId?: string | null;
  favoritesOnly?: boolean;
  includeArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function searchSavedItems(
  userId: string,
  params: SearchParams,
): Promise<SavedItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("search_saved_items", {
    p_user_id: userId,
    p_query: params.query?.trim() || null,
    p_input_type: params.type && params.type !== "all" ? params.type : null,
    p_collection_id: params.collectionId || null,
    p_project_id: params.projectId || null,
    p_favorites_only: params.favoritesOnly ?? false,
    p_include_archived: params.includeArchived ?? false,
    p_date_from: params.dateFrom || null,
    p_date_to: params.dateTo || null,
    p_limit: params.limit ?? 100,
  });

  if (error || !data) return [];
  return data as SavedItem[];
}
