import { searchSavedItems } from "@/lib/db/search";
import { getTagsForItems } from "@/lib/db/tags";
import type { SavedItem } from "@/types/database";
import type { AskCandidate } from "./types";

const STOPWORDS = new Set(
  (
    "a an the i me my mine we you your it its this that these those and or but if then so as at by for from in into of on onto to with about " +
    "is are was were be been being am do did does have has had can could would should will just please " +
    "find show get give tell what which who whom when where why how some any something anything one ones thing things " +
    "saved save looking look want need remember recall think thought kind sort"
  ).split(" "),
);

function keywordsFrom(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 8);
}

const MAX_CANDIDATES = 40;

/**
 * Gathers the pre-filtered set of the user's own items that Ask Recall
 * hands to the model (Section 15). The AI is never asked to browse the
 * whole table: it only sees what this returns.
 *
 * Kept behind this single function on purpose so it can later be
 * swapped for a vector-similarity query without touching the Ask Recall
 * route or the model prompt.
 *
 * Strategy: (1) match ANY of the question's keywords via the ranked
 * full-text function from Phase 12 (a whole sentence AND-ed together
 * would almost never match anything), then (2) top up with recent items
 * so a vaguely worded question still has something to work with.
 * Everything runs through search_saved_items with the caller's own
 * session, so RLS and the explicit user_id filter both apply.
 */
export async function retrieveCandidates(
  userId: string,
  question: string,
): Promise<AskCandidate[]> {
  const keywords = keywordsFrom(question);

  const [keywordHits, recent] = await Promise.all([
    keywords.length > 0
      ? searchSavedItems(userId, { query: keywords.join(" or "), limit: 30 })
      : Promise.resolve([] as SavedItem[]),
    searchSavedItems(userId, { limit: 20 }),
  ]);

  const seen = new Set<string>();
  const items: SavedItem[] = [];
  for (const item of [...keywordHits, ...recent]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
    if (items.length === MAX_CANDIDATES) break;
  }

  const tagsByItem = await getTagsForItems(items.map((i) => i.id));
  return items.map((item) => ({ item, tags: tagsByItem[item.id] ?? [] }));
}
