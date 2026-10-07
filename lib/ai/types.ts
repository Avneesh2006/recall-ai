import type { SavedItem } from "@/types/database";

/** The subset of a saved item's fields relevant to enrichment/search prompts. */
export interface SavedItemInput {
  title: string | null;
  description: string | null;
  url: string | null;
  input_type: string;
  content_type: string | null;
  source_domain: string | null;
  what_was_i_thinking: string | null;
  content_text: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  media_kind: "image" | "video" | "pdf" | null;
}

export interface EnrichmentResult {
  category: string;
  /** Content type override, if the AI has a better guess than the hostname-based one. Usually null. */
  contentType: string | null;
  summary: string;
  contentUnderstanding: string;
  tags: string[];
  possibleUse: string | null;
}

/** A saved item plus the tag names attached to it, as handed to the model. */
export interface AskCandidate {
  item: SavedItem;
  tags: string[];
}

export interface AskRecallAnswer {
  /** Ranked best-first. Empty means "nothing here matches", which is a valid answer. */
  matches: { item: SavedItem; why: string }[];
}

/**
 * Provider-agnostic AI abstraction (Section 14) — swap the concrete
 * implementation (currently OpenRouter, in openrouter.ts) without
 * touching any call site.
 */
export interface AIService {
  classifyItem(item: SavedItemInput): Promise<{ category: string; contentType: string | null }>;
  generateSummary(item: SavedItemInput): Promise<string>;
  generateTags(item: SavedItemInput): Promise<string[]>;
  suggestPossibleUse(item: SavedItemInput): Promise<string | null>;
  /** Ids of candidates that relate to `item`, best first. Resolves null when AI is unavailable. */
  findRelatedMemories(item: SavedItem, candidates: SavedItem[]): Promise<string[] | null>;
  /** Ask Recall. Resolves null when AI is unavailable (distinct from "no matches"). */
  answerMemoryQuery(query: string, candidates: AskCandidate[]): Promise<AskRecallAnswer | null>;
}
