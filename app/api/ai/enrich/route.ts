import { createClient } from "@/lib/supabase/server";
import { enrichItem } from "@/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ itemId: z.string().uuid() });

/**
 * Explicit, user-triggered "Re-analyze with AI" (Section 14: automatic
 * enrichment runs exactly once per item; re-running is only ever a
 * deliberate click). Unlike the fire-and-forget call right after a save,
 * this awaits the result — the person clicked a button and is waiting
 * to see what happened.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // RLS already restricts this select to the caller's own rows, so an
  // item id belonging to someone else comes back empty here — a clean
  // 404 rather than quietly running AI against another user's data.
  const { data: owned } = await supabase
    .from("saved_items")
    .select("id")
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)
    .single();
  if (!owned) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const result = await enrichItem(parsed.data.itemId);

  const { data: item } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", parsed.data.itemId)
    .single();

  if (!result.ok) {
    return NextResponse.json(
      { error: "AI organizing is unavailable right now.", item },
      { status: 502 },
    );
  }

  return NextResponse.json({ item });
}
