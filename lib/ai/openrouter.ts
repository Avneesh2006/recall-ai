import type { SavedItem } from "@/types/database";
import { callOpenRouter, callOpenRouterJSON, type OpenRouterContentPart } from "./openrouter-client";
import type { AIService, AskCandidate, AskRecallAnswer, EnrichmentResult, SavedItemInput } from "./types";

function describeItem(item: SavedItemInput): string {
  return [
    `Title: ${item.title ?? "(untitled)"}`,
    item.url ? `URL: ${item.url}` : null,
    item.source_domain ? `Source: ${item.source_domain}` : null,
    item.content_type ? `Content type: ${item.content_type}` : null,
    item.description ? `Description: ${item.description.slice(0, 1200)}` : null,
    item.content_text ? `Extracted page/document text:\n${item.content_text.slice(0, 12000)}` : null,
    item.what_was_i_thinking
      ? `The user's own note on why they saved it: "${item.what_was_i_thinking}"`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM_PROMPT = `You are Recall's content-understanding engine. You analyze the actual content attached to a saved memory, not just its URL metadata.
Return ONLY one minified JSON object:
{"category":string,"summary":string,"contentUnderstanding":string,"tags":string[],"possibleUse":string|null}
Rules:
- Inspect the supplied text, image, PDF or video when present.
- summary: 2-4 concise sentences describing the actual content.
- contentUnderstanding: detailed factual notes, key ideas, entities, steps, topics, phrases and useful searchable concepts from the content; max 4000 characters. This becomes Recall's internal memory of the content.
- tags: 4-10 lowercase searchable keywords, including distinctive concepts, names, tools, topics or subjects actually present.
- possibleUse: one concrete later use, or null.
- Never invent details. If the supplied source cannot be accessed or only contains metadata, say so in contentUnderstanding and summarize only what is actually available.
- Never rewrite the user's personal note as if it came from the source.`;

function buildContent(item: SavedItemInput): OpenRouterContentPart[] {
  const parts: OpenRouterContentPart[] = [{ type: "text", text: describeItem(item) }];

  if (item.media_url) {
    if (item.content_type === "video" || item.media_kind === "video") {
      parts.push({ type: "video_url", video_url: { url: item.media_url } });
    } else if (item.media_kind === "image" || item.content_type === "image") {
      parts.push({ type: "image_url", image_url: { url: item.media_url } });
    } else if (item.media_kind === "pdf" || item.content_type?.includes("pdf")) {
      parts.push({
        type: "file",
        file: { filename: item.title || "document.pdf", file_data: item.media_url },
      });
    }
  }

  if (!item.media_url && item.thumbnail_url) {
    parts.push({ type: "image_url", image_url: { url: item.thumbnail_url } });
  }

  return parts;
}

export async function runFullEnrichment(item: SavedItemInput): Promise<EnrichmentResult | null> {
  const raw = await callOpenRouterJSON<{
    category?: unknown;
    summary?: unknown;
    contentUnderstanding?: unknown;
    tags?: unknown;
    possibleUse?: unknown;
  }>(SYSTEM_PROMPT, buildContent(item));

  if (!raw) return null;

  const summary = typeof raw.summary === "string" ? raw.summary.trim().slice(0, 1200) : "";
  if (!summary) return null;

  return {
    category:
      typeof raw.category === "string" && raw.category.trim()
        ? raw.category.trim().slice(0, 80)
        : "Uncategorized",
    contentType: null,
    summary,
    contentUnderstanding:
      typeof raw.contentUnderstanding === "string"
        ? raw.contentUnderstanding.trim().slice(0, 5000)
        : summary,
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .map((t) => String(t).toLowerCase().trim())
          .filter((t) => t.length > 0 && t.length <= 50)
          .slice(0, 10)
      : [],
    possibleUse:
      typeof raw.possibleUse === "string" && raw.possibleUse.trim()
        ? raw.possibleUse.trim().slice(0, 300)
        : null,
  };
}

const ASK_SYSTEM_PROMPT = `You help a person find something they saved earlier in Recall. You receive the user's question and candidate memories that were already filtered to belong to that person.
Reply ONLY with a minified JSON object:
{"matches":[{"n":number,"why":string}]}
Rules:
- n must be a candidate number.
- Return at most 5 genuinely relevant matches, best first. If none fit, return an empty array.
- Match by meaning, not only exact words. Use title, description, original URL, personal note, AI summary, AI content understanding, category and tags.
- why must be one short sentence explaining the match.
- Never claim facts not present in a candidate.`;

function candidatePrompt(query: string, candidates: AskCandidate[]): string {
  return [
    `User question: ${query}`,
    "",
    ...candidates.map((c, index) => {
      const i = c.item;
      return [
        `MEMORY ${index + 1}`,
        `Title: ${i.title ?? "(untitled)"}`,
        `URL: ${i.url ?? ""}`,
        `Source: ${i.source_domain ?? ""}`,
        `Personal note: ${i.what_was_i_thinking ?? ""}`,
        `AI summary: ${i.ai_summary ?? ""}`,
        `AI content understanding: ${i.ai_content ?? ""}`,
        `AI category: ${i.ai_category ?? ""}`,
        `Tags: ${c.tags.join(", ")}`,
        `Saved: ${i.saved_at}`,
      ].join("\n");
    }),
  ].join("\n\n");
}

export const openRouterAIService: AIService = {
  async classifyItem(item) {
    const result = await runFullEnrichment(item);
    return { category: result?.category ?? "Uncategorized", contentType: result?.contentType ?? null };
  },
  async generateSummary(item) {
    return (await runFullEnrichment(item))?.summary ?? "";
  },
  async generateTags(item) {
    return (await runFullEnrichment(item))?.tags ?? [];
  },
  async suggestPossibleUse(item) {
    return (await runFullEnrichment(item))?.possibleUse ?? null;
  },
  async findRelatedMemories() {
    return null;
  },
  async answerMemoryQuery(query, candidates): Promise<AskRecallAnswer | null> {
    const raw = await callOpenRouterJSON<{ matches?: unknown }>(
      ASK_SYSTEM_PROMPT,
      candidatePrompt(query, candidates),
    );
    if (!raw || !Array.isArray(raw.matches)) return null;

    const matches: { item: SavedItem; why: string }[] = [];
    for (const entry of raw.matches) {
      if (!entry || typeof entry !== "object") continue;
      const n = Number((entry as { n?: unknown }).n);
      const why = String((entry as { why?: unknown }).why ?? "").trim().slice(0, 240);
      if (!Number.isInteger(n) || n < 1 || n > candidates.length) continue;
      const item = candidates[n - 1]?.item;
      if (!item) continue;
      if (!matches.some((m) => m.item.id === item.id)) matches.push({ item, why });
      if (matches.length === 5) break;
    }
    return { matches };
  },
};

