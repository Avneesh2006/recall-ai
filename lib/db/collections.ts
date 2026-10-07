import { createClient } from "@/lib/supabase/server";
import type { CreateCollectionInput, UpdateCollectionInput } from "@/lib/validation/collection";
import type { Collection } from "@/types/database";

export async function listCollections(userId: string): Promise<Collection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Collection[];
}

export async function getCollection(id: string): Promise<Collection | null> {
  const supabase = createClient();
  const { data } = await supabase.from("collections").select("*").eq("id", id).single();
  return (data as Collection) ?? null;
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<{ collection: Collection | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, ...input })
    .select()
    .single();

  if (error) return { collection: null, error: error.message };
  return { collection: data as Collection, error: null };
}

export async function updateCollection(
  id: string,
  patch: UpdateCollectionInput,
): Promise<{ collection: Collection | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("collections")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { collection: null, error: error.message };
  return { collection: data as Collection, error: null };
}

export async function deleteCollection(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  return { error: error?.message ?? null };
}
