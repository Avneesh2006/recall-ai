/**
 * Server-only OpenRouter client.
 * Supports text plus multimodal content (images, PDFs and video URLs).
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_MODELS = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "google/gemma-4-26b-a4b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 45_000;

export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "video_url"; video_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export type OpenRouterUserContent = string | OpenRouterContentPart[];

export type OpenRouterResult =
  | { ok: true; text: string; model: string }
  | { ok: false; reason: string };

function modelsToTry(hasMedia: boolean): string[] {
  const custom = process.env.OPENROUTER_MODEL?.trim();
  const preferred = hasMedia
    ? [
        custom,
        "openrouter/free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "google/gemma-4-26b-a4b-it:free",
      ]
    : [custom, "openrouter/free", ...FALLBACK_MODELS];

  return [...new Set(preferred.filter((m): m is string => Boolean(m)))].slice(0, MAX_ATTEMPTS);
}

export async function callOpenRouter(
  systemPrompt: string,
  userContent: OpenRouterUserContent,
): Promise<OpenRouterResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "no_key" };

  const hasMedia = Array.isArray(userContent) && userContent.some((part) => part.type !== "text");
  let lastReason = "unknown";

  for (const model of modelsToTry(hasMedia)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Recall",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 1200,
        }),
      });

      if (res.status === 401) return fail("invalid_key: OpenRouter rejected the API key (HTTP 401)");
      if (res.status === 402) return fail("no_credits: OpenRouter says the account has insufficient credits (HTTP 402)");

      if (!res.ok) {
        const body = (await res.text().catch(() => "")).slice(0, 500);
        lastReason = `HTTP ${res.status} from ${model}: ${body}`;
        console.warn(`[recall:ai] ${lastReason} — trying next model`);
        continue;
      }

      const json = await res.json().catch(() => null);
      const text: unknown = json?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        lastReason = `empty response from ${model}`;
        console.warn(`[recall:ai] ${lastReason} — trying next model`);
        continue;
      }

      return { ok: true, text, model };
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      lastReason = aborted
        ? `timeout after ${REQUEST_TIMEOUT_MS / 1000}s on ${model}`
        : `network_error: ${String(e)}`;
      console.warn(`[recall:ai] ${lastReason}`);
      if (!aborted) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  return fail(lastReason);
}

function fail(reason: string): OpenRouterResult {
  console.warn(`[recall:ai] failed: ${reason}`);
  return { ok: false, reason };
}

export async function callOpenRouterJSON<T>(
  systemPrompt: string,
  userContent: OpenRouterUserContent,
): Promise<T | null> {
  const result = await callOpenRouter(systemPrompt, userContent);
  if (!result.ok) return null;

  const cleaned = result.text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.warn(`[recall:ai] ${result.model} replied without JSON`);
    return null;
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    console.warn(`[recall:ai] ${result.model} replied with malformed JSON`);
    return null;
  }
}
