/**
 * Recall's whole visual identity is "preserved in amber" (see
 * DECISIONS.md, Phase 2). This makes that literal instead of just
 * decorative: the longer a memory sits since you saved it, the more it
 * visually takes on the warm, faintly glowing patina of something
 * actually preserved — like an insect in resin. It's not a "your stuff
 * is stale, go deal with it" nag (no bookmarking app needs another
 * guilt mechanic); it's closer to how a photograph left in the sun
 * develops a warm tone — saved things that have been sitting for a
 * while start to look and feel like memories rather than just links.
 *
 * Nothing else in the bookmarking-app space does this, as far as we
 * know — most either show a raw timestamp or nothing at all.
 */

export interface PatinaLevel {
  /** 0 (just saved) to 1 (fully "amber-aged", capped at ~4 months). */
  intensity: number;
  /** Only worth surfacing a label once it's actually noticeable. */
  isAged: boolean;
  label: string;
}

const MAX_AGE_DAYS = 120; // intensity caps here — no infinite creep
const AGED_THRESHOLD_DAYS = 21; // below this, patina is present but not called out

export function getPatinaLevel(savedAtIso: string): PatinaLevel {
  const days = (Date.now() - new Date(savedAtIso).getTime()) / 86_400_000;
  const intensity = Math.max(0, Math.min(days / MAX_AGE_DAYS, 1));

  let label = "";
  if (days >= 90) label = "A well-aged memory";
  else if (days >= 30) label = `Sitting for ${Math.round(days / 30)} months`;
  else if (days >= AGED_THRESHOLD_DAYS) label = `Sitting for ${Math.round(days / 7)} weeks`;

  return { intensity, isAged: days >= AGED_THRESHOLD_DAYS, label };
}
