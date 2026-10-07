import { createClient } from "@/lib/supabase/server";
import { searchSavedItems } from "@/lib/db/search";
import { NextResponse } from "next/server";
import type { InputType } from "@/types/database";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const p = url.searchParams;

  const items = await searchSavedItems(user.id, {
    query: p.get("q") ?? "",
    type: (p.get("type") as InputType | "all" | null) ?? "all",
    collectionId: p.get("collection_id"),
    projectId: p.get("project_id"),
    favoritesOnly: p.get("favorites") === "1",
    includeArchived: p.get("archived") === "1",
    dateFrom: p.get("from") ?? undefined,
    dateTo: p.get("to") ?? undefined,
  });

  return NextResponse.json({ items });
}
