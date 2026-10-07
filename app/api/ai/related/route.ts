import { createClient } from "@/lib/supabase/server";
import { retrieveCandidates } from "@/lib/ai/retrieve";
import { openRouterAIService } from "@/lib/ai/openrouter";
import type { SavedItem } from "@/types/database";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ itemId: z.string().uuid() });

/**
 * Explicit, user-triggered "Look deeper with AI" on the Related Memories
 * rail (Section 14: AI is never run automatically beyond the one-time
 * enrichment). Candidates are gathered by keyword from the item's own
 * text via retrieveCandidates, scoped to the caller, then the model
 * picks which genuinely relate.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", parsed.data.itemId)
    .eq("user_id", user.id)
    .single();
  const item = data as SavedItem | null;
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const seedText = [item.title, item.ai_category, item.ai_summary, item.what_was_i_thinking]
    .filter(Boolean)
    .join(" ");
  const candidates = (await retrieveCandidates(user.id, seedText))
    .map((c) => c.item)
    .filter((c) => c.id !== item.id);

  const ids = await openRouterAIService.findRelatedMemories(item, candidates);
  if (!ids) {
    return NextResponse.json({ error: "AI suggestions are unavailable right now." }, { status: 502 });
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  return NextResponse.json({ items: ids.map((id) => byId.get(id)).filter(Boolean) });
}
