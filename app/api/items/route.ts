import { createClient } from "@/lib/supabase/server";
import { createSavedItem, listSavedItemsPage } from "@/lib/db/saved-items";
import { triggerEnrichment } from "@/lib/ai";
import { waitUntil } from "@vercel/functions";
import { createSavedItemSchema } from "@/lib/validation/saved-item";
import { NextResponse } from "next/server";

/** Loads a page of the signed-in user's items — used by Library/Timeline's "load more" (Section 20). */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit")) || 30;

  const page = await listSavedItemsPage(user.id, { cursor, limit });
  return NextResponse.json(page);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSavedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const { item, error } = await createSavedItem(user.id, parsed.data);
  if (error || !item) {
    return NextResponse.json({ error: error ?? "Couldn't save that item." }, { status: 500 });
  }

  // Fire-and-forget — never let enrichment delay the response back to the user.
  // URL saves are the one exception: their title/description arrive via a
  // separate background scrape (see enrichUrlMetadataInBackground in
  // lib/db/saved-items.ts), which now triggers AI enrichment itself once
  // that finishes — previously both ran in parallel from here, so AI
  // enrichment usually saw a title-less, description-less row for every
  // link save. Note/image/file items have everything up front, so this
  // fires immediately for those.
  if (item.input_type !== "url") waitUntil(triggerEnrichment(item.id));

  return NextResponse.json({ item }, { status: 201 });
}
