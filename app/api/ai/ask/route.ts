import { createClient } from "@/lib/supabase/server";
import { retrieveCandidates } from "@/lib/ai/retrieve";
import { openRouterAIService } from "@/lib/ai/openrouter";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ question: z.string().trim().min(2, "Ask a question first").max(500) });

/**
 * Ask Recall (Section 15). Strictly scoped to the signed-in user:
 * candidates come from queries run under their own session, and only
 * those rows' fields are ever put in the prompt.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, {
      status: 400,
    });
  }

  const candidates = await retrieveCandidates(user.id, parsed.data.question);

  // An empty library is a real answer, not an AI failure — skip the model call.
  if (candidates.length === 0) return NextResponse.json({ matches: [] });

  const answer = await openRouterAIService.answerMemoryQuery(parsed.data.question, candidates);
  if (!answer) {
    // AI is unavailable — fall back to the DB-retrieved candidates
    // themselves (already relevance-ranked by retrieveCandidates via the
    // Phase 12 search function) rather than returning nothing. A person
    // asking "find the English song I saved" should still see their
    // actual saved items even with no model to summarize why.
    return NextResponse.json({
      matches: candidates.slice(0, 5).map((c) => ({ item: c.item, why: "" })),
      aiUnavailable: true,
    });
  }

  return NextResponse.json({ matches: answer.matches });
}
