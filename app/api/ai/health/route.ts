import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter-client";
import { NextResponse } from "next/server";

function hintFor(reason: string): string {
  if (reason === "no_key") {
    return "OPENROUTER_API_KEY isn't set. It must be in .env.local in the same folder as package.json, and the dev server must be restarted after editing it.";
  }
  if (reason.startsWith("invalid_key")) {
    return "OpenRouter rejected the key. Re-copy it from openrouter.ai/keys (it starts with sk-or-), with no quotes or spaces around it in .env.local.";
  }
  if (reason.startsWith("no_credits")) {
    return "OpenRouter reports no credits. Free ':free' models normally need none, so check the account at openrouter.ai/credits.";
  }
  if (/data policy|no endpoints/i.test(reason)) {
    return "Free models are blocked by your OpenRouter privacy settings. Open openrouter.ai/settings/privacy and allow free models (they may log prompts), then retry.";
  }
  if (reason.includes("HTTP 429")) {
    return "Rate limited. Free models have tight per-minute and per-day limits — wait a minute and retry.";
  }
  if (reason.includes("HTTP 404")) {
    return "The free models tried are unavailable. Pick a current ':free' model at openrouter.ai/models and set OPENROUTER_MODEL in .env.local.";
  }
  if (reason.startsWith("network_error")) {
    return "This machine couldn't reach openrouter.ai. Check your internet connection or firewall.";
  }
  return "See the terminal running `npm run dev` for the [recall:ai] log lines.";
}

/**
 * GET /api/ai/health — signed-in only. Makes one tiny model call and
 * reports whether AI is actually working, and if not, why. Never
 * returns the key.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const keyPresent = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  const result = await callOpenRouter(
    "Reply with only this JSON and nothing else.",
    '{"ok":true}',
  );

  if (result.ok) {
    return NextResponse.json({ ok: true, keyPresent, model: result.model, reply: result.text.slice(0, 80) });
  }
  return NextResponse.json(
    { ok: false, keyPresent, reason: result.reason, hint: hintFor(result.reason) },
    { status: 200 },
  );
}
