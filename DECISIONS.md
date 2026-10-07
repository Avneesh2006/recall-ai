# DECISIONS.md

Assumptions and choices made where the brief was ambiguous, in build order.

## Phase 1–2: Project setup & design system

- **Next.js version pinned to 14.2.15** (App Router, stable) rather than latest canary, for
  build reliability with the listed dependency set.
- **Design direction: "preserved in amber."** The brief left color/type choices open beyond
  "pick one signature accent." Chose a warm resin-amber (`#E3A548`) against a near-black,
  warm-undertone ground (`#0D0B09`) rather than the more generic near-black + acid-green/indigo
  combination — amber-as-preservation ties directly to the product's core metaphor (keeping
  the thing and the thought intact). Display face: Fraunces (editorial serif, optical sizing).
  Body face: Inter.
- **shadcn/ui**: rather than scaffolding via the shadcn CLI (requires network access this
  environment doesn't have), primitives are hand-built following the same pattern (Radix
  primitives + `cva` + `cn()`), so `npx shadcn add` can still be used later without conflict —
  just run `npx shadcn init` once locally and point `components.json` at `/components`.
- **Theme switching**: implemented via `data-theme` attribute + inline blocking script (no
  FOUC), persisted to `localStorage` under `recall-theme`. Full Settings → Appearance UI comes
  in a later phase; the mechanism is wired now since it affects every component's tokens.
- **Landing page**: built a hero pass now (headline, save-card preview) since it depends on
  the design system just established. The "interactive scripted demo" called for in Section 8
  is deferred to the Advanced UI Animations phase, where Framer Motion orchestration is set up.
- **Network constraint**: this build environment has no outbound network access, so
  `npm install` / `next build` / Supabase calls cannot be executed or verified here. Code is
  written to compile cleanly against the pinned dependency versions in `package.json`; run
  `npm install && npm run build` in your own environment to verify before deploying.

## Phase 3–5: Auth, Database, RLS

- **Session validation uses `supabase.auth.getUser()`, never `getSession()`**, in both
  middleware and Server Components — `getUser()` revalidates the token against Supabase
  instead of trusting whatever's in the cookie, which matters since middleware is the actual
  security gate for `/app/*`.
- **Forgot-password enumeration**: `forgotPassword()` always reports success regardless of
  whether the email exists, so the endpoint can't be used to check which emails have accounts.
- **Server Actions + `useFormState`** chosen over client-side fetch calls for all auth forms —
  keeps validation server-side-first per Section 19, works without JS, and gives free
  pending/error states via `useFormStatus`.
- **`buttonStyles` lives in `lib/button-styles.ts`, not inside the `"use client"`
  `AnimatedButton.tsx`.** Found this the hard way in Phase 1: Next.js can't reliably let a
  Server Component import a non-component export from a `"use client"` module — it resolves
  to `undefined` at runtime. Any future primitive that needs to be both styled-in-JS and
  imported by Server Components should follow the same split (component in a client file,
  shared style/logic function in a plain one).
- **Dashboard (`/app`) is a placeholder** — real Library/Timeline/etc. pages arrive in later
  phases. It exists now only to prove the auth + profile-trigger + RLS chain works end to end.
- **RLS two-user isolation test is NOT verified by me** — this sandbox has no network access
  to a real Supabase project. `TESTING.md` has the exact steps; this must be run and checked
  off before trusting Phase 5 as done, per the master prompt's own acceptance criteria.

## Phase 6: Save system

- **Metadata parsing uses regex, not a DOM/HTML parser library.** Adding `cheerio` would mean
  another `npm install` round-trip. Regex against `<title>`, `og:title/description/image`,
  and `<link rel="icon">` covers the vast majority of real pages; it's less robust than a real
  parser against malformed HTML, but it's a reasonable v1 trade-off given the constraint. If
  metadata quality turns out to matter more than expected, swapping in `cheerio` inside
  `lib/metadata.ts` is a contained change — nothing else needs to know.
- **SSRF protection resolves DNS and checks every returned IP** against private/loopback/
  link-local ranges before fetching (Section 19) — this also blocks the classic
  `169.254.169.254` cloud-metadata SSRF target. It does not defend against DNS-rebinding
  (IP changing between the check and the actual fetch) — acceptable for v1's threat model
  (a personal bookmarking tool, not a public multi-tenant scraper), but worth hardening later
  if this endpoint is ever exposed more broadly.
- **Storage bucket (`recall-uploads`) is public-read**, with write/delete restricted by RLS to
  the uploader's own `<user_id>/` folder prefix. Chosen over private + signed URLs to avoid
  needing a signed-URL refresh mechanism in the UI for v1 — paths are unguessable
  (UUID-prefixed), so this is "security by obscurity" for reads specifically, which is an
  accepted trade-off for a personal-use bookmarking tool, not for anything sensitive.
- **Keyboard shortcut for Save is a bare "S"** (no modifier), disabled while focus is in a
  text field. The master prompt didn't specify a key; chose something reachable one-handed
  without a chord, consistent with how Gmail/Superhuman-style shortcuts work.
- **AI enrichment trigger (`lib/ai/index.ts`) is a real function with the final call sites
  already wired in** (`/api/items` calls it, fire-and-forget, after every create) — but the
  function body is a no-op stub. Phase 13 fills in the actual OpenRouter calls behind the
  same signature, so nothing calling it today needs to change.
- **No "organizing…" shimmer UI yet.** That needs a persistent card to shimmer on, and the
  Library (where cards live) doesn't exist until Phase 7. The AI status is already being
  tracked on the row (`ai_status`), so the shimmer is purely a Phase 7 rendering concern.

## Phase 7: Library

- **`triggerEnrichment` now sets `ai_status: 'skipped'` instead of leaving it `'pending'`.**
  Caught while wiring up the card's AI-status display: `'pending'` should mean "actually being
  processed right now" so the shimmer means something. Since Phase 13 hasn't wired up real
  enrichment yet, leaving items in `'pending'` forever would render an indefinite loading
  shimmer that never resolves — worse than just not showing anything. `'skipped'` renders as
  no badge at all (quietly correct); `'failed'` is reserved for genuine enrichment failures
  once Phase 13 exists.
- **No pagination on the Library yet** (Section 20 handles that explicitly in the Performance
  phase) — `listSavedItems` loads everything for the user in one query, and all filter/sort/
  search happens client-side over that set. Fine for a personal library's likely size; will
  need a cursor-based rewrite before Phase 20.
- **Library search is client-side substring matching**, not the Postgres full-text search
  from Section 15 — that's explicitly a Phase 12 deliverable (`search_vector` already exists
  in the DB from Phase 4, just unused by the UI so far).
- **Item Detail exists as a full route (`/app/item/[id]`)**, not a modal, per Section 8's page
  list — reachable from every Memory Card. Editing reason/note here PATCHes the same endpoint
  the Save Dialog uses.
- **Card "more" menu only has Delete for now.** "Add to Collection" (Section 7.6's hover row
  spec) is deferred until Collections exist in Phase 8 — omitted rather than shown disabled,
  since a visible-but-dead menu item would violate the "no non-functional feature" rule in
  Section 31.
- **Found and fixed a Radix `asChild` bug while building the card's dropdown trigger**: wrapping
  the trigger button in an extra `<span>` meant Radix's Slot merged its onClick/aria/ref props
  onto the span instead of the actual `<button>`. Fixed by making `IconAction` a
  forward-ref component that spreads all incoming props directly onto the button, so it works
  correctly both as a plain icon button and as a Trigger's direct child. Worth remembering for
  any future Radix `asChild` usage (Command Palette, other menus): the child must forward its
  ref and spread props, never sit behind a wrapper element.
- **Fixed a self-inflicted syntax bug**: a JSDoc comment on `IconAction` contained the literal
  text `aria-*/ref`, and the `*/` inside that phrase closed the comment block early, leaving
  the next few lines as broken syntax. Reworded to avoid `*/` appearing mid-comment. Worth
  remembering when writing future doc comments that mention CSS/ARIA attribute wildcards.

## Card upgrades (post-Phase-7 refinement, user-requested)

- **Hover-to-play video previews**: `lib/video.ts` detects YouTube/Vimeo links (and direct
  video files) and builds a muted, looping, autoplay embed/`<video>` source. `MediaPreview`
  shows the static thumbnail at rest and swaps to the real preview on hover — no click-through
  needed just to see what something is. Clicking the card still opens the internal Item Detail
  page (never an external site) for the full view/edit.
- **No forced cropping, including vertical Reels/Shorts.** Plain images now render as native
  `<img>` at `h-auto` instead of a fixed `aspect-video` box with `object-cover` — the box height
  follows the image's real proportions. Video previews use a portrait `9:16` box instead of
  `16:9` when the URL matches a Shorts/Reel/TikTok pattern, and a self-uploaded video's exact
  ratio is measured from its real `videoWidth`/`videoHeight` once metadata loads rather than
  guessed. A fixed 16:9 box is used only for third-party iframe embeds (YouTube/Vimeo players
  are actually built at that ratio, so that's not a crop).
- **Inline-editable titles** (`EditableTitle`): click a title — on the card or the Item Detail
  page — to rename it in place; Enter/blur saves, Escape cancels. Since the card wraps its
  content in a `<Link>`, the title's click handler calls `preventDefault`/`stopPropagation` so
  editing doesn't trigger navigation. Card edits commit immediately (optimistic, matching the
  favorite/archive pattern); Detail-page reason/note edits still batch behind the explicit
  "Save changes" button, but title there also commits immediately for consistency with the card.
- **Two original features, not requested by the master prompt but added on request:**
  - **Amber Patina** (`lib/patina.ts`) — makes the "preserved in amber" concept literal: a
    card's border and inner glow warm up the longer it's sat since being saved, capped at 120
    days, with a small aged-label ("Sitting for 3 weeks" / "A well-aged memory") past 21 days.
    Pure CSS driven off `saved_at`, no new backend or AI needed. Deliberately not a nag —
    no red flags, no "clean this up" framing, just a warmer visual tone.
  - **Similar Saves** — a "you've saved something like this before" indicator computed
    client-side in `LibraryView` by grouping the already-loaded items by domain (or content
    type when there's no domain, e.g. notes). Shows as a small pill on the card; clicking it
    filters the library to that group. No new query, no AI — just noticing a pattern in data
    that was already in memory. This is a lightweight preview of what Phase 15's "Related
    Memories" will do properly with AI; this version is intentionally simple (exact-domain
    grouping, not semantic similarity) and can be superseded rather than extended when that
    phase lands.
- **`content_type` and `url` are now settable on image/file uploads** (previously only set
  server-side to a fixed value). Needed so an uploaded video file gets `content_type: 'video'`
  and a real playable `url`, giving it the same hover-preview treatment as a saved video link.
- **`title` is now a valid field in the PATCH schema.** Straightforward addition — no
  interesting trade-off, just something the create-time schema had and the update-time one
  was missing.

## Bug fixes (user-reported): uploaded-video thumbnails, Instagram/YouTube saves

- **Uploaded videos had no thumbnail** (hover-play worked, but the at-rest state showed nothing).
  Only image uploads ever got a `thumbnail_url`. Fixed by capturing an actual frame from the
  uploaded video client-side (`lib/storage/video-thumbnail.ts`: an off-screen `<video>`, seek to
  ~1s in, draw to canvas, export as JPEG) and uploading that frame to Storage as the thumbnail.
  Never blocks the save — resolves `null` on any failure (corrupt file, unsupported codec,
  8s timeout) and the item still saves without a thumbnail rather than erroring.
- **Instagram/YouTube link saves had no thumbnail and no hover-playback.** Root cause: both
  `content_type` and `thumbnail_url` were previously set *only if* the server-side metadata
  fetch to the actual page succeeded. Instagram in particular frequently blocks or
  login-walls non-browser requests (returns a page with no usable Open Graph tags, sometimes a
  non-200 status), so the whole fetch would come back empty and the item saved with no
  content_type at all — meaning the hover-preview logic (`content_type === 'video'`) never
  triggered, regardless of how obviously the URL was a video link.
  - Fix: content_type is now guessed from the **hostname alone** first
    (`guessContentTypeFromHostname` in `lib/metadata.ts`), independent of whether the page
    fetch succeeds — so an Instagram/YouTube/TikTok/Vimeo URL is correctly tagged even when
    scraping is blocked entirely.
  - YouTube additionally gets a **deterministic thumbnail** (`img.youtube.com/vi/<id>/hqdefault.jpg`,
    a public, unauthenticated static image YouTube serves for any video ID) as a fallback when
    Open Graph scraping doesn't produce one — this doesn't depend on the fetch working at all
    for the thumbnail specifically.
  - **Instagram honesty note**: even with content_type now correctly set, Instagram Reels still
    won't get a real hover-playing preview or a thumbnail image. Unlike YouTube/Vimeo, Instagram
    doesn't offer any public, unauthenticated way to embed a specific video or fetch its
    thumbnail — their oEmbed API requires a registered Meta developer app and access token,
    which is out of scope here. `getVideoEmbed` deliberately returns `null` for Instagram/TikTok
    rather than pointing an `<iframe>` at a URL that would just show a blank frame or login
    wall — Instagram saves now correctly show as a labeled video card (🎬 glyph) instead of a
    broken-looking one, which is the honest ceiling without official API access. If this
    matters enough to invest in, the fix would be registering a Meta Graph API app and using
    its oEmbed endpoint — a real scope addition, not a bug fix.

## Phase 8: Collections

- **Icon and accent-color pickers are small fixed presets** (`lib/collection-presets.ts`) —
  10 emoji, 6 accent colors — rather than a free-form emoji picker or `<input type="color">`.
  Keeps every collection visually consistent with the rest of the design system (the accents
  are hand-picked to sit well against the dark amber-toned background) instead of letting
  arbitrary user-picked colors clash with it.
  - **Note the trade-off if this app is ever localized or genuinely globalized**: a fixed emoji
    set is a reasonable v1 shortcut but isn't a real substitute for a proper emoji picker long
    term. Flagging it here rather than treating it as a closed decision.
- **Deleting a collection never deletes its items.** This falls straight out of the schema's
  `on delete set null` on `saved_items.collection_id` (Section 10) — items just lose their
  collection assignment. No app-level logic needed to enforce this; worth knowing it's a DB
  guarantee, not something the delete handler is responsible for getting right.
- **"Move to collection" delivered as promised in Phase 7's decisions log.** Extracted the
  favorite/archive/delete/rename logic that Library and Collection Detail both need into
  `hooks/useSavedItemActions.ts` rather than copy-pasting it into a second view — the two
  pages were about to duplicate a nontrivial amount of optimistic-update logic, and keeping
  them in sync by hand across future changes was a real risk.
- **Collection picker added to both the Save Dialog's reason step and the Item Detail page**,
  per Section 5 Flow A ("optional collection/project picker"). The project half of that is
  deferred to Phase 9, once projects actually exist.
- **No dedicated `/api/items?collection_id=` query param** — `listSavedItemsByCollection` is a
  direct DB-layer function called from the Collection Detail *page* (Server Component), not
  through the generic items API. Consistent with how `listSavedItems` already works for the
  Library page; a query-string filtering API can be added later if a client-side consumer
  needs it (e.g. Search in Phase 12).
- **Extracted `IconActionButton`** (`components/IconActionButton.tsx`) out of `MemoryCard` —
  Collections needed the exact same ref-forwarding icon-button pattern (for the same Radix
  `asChild` reason documented in the Phase 7 entry above), and a third near-duplicate in
  `ProjectCard` would have been one too many copies to keep in sync by hand.

## Phase 9: Projects

- **Built as a near-mirror of Collections** (same CRUD shape, same card/grid/form-dialog
  pattern) since Section 18's spec for Projects is structurally almost identical to
  Section 17's Collections — deliberately kept the two consistent rather than inventing a
  different interaction pattern for no reason.
- **No progress ring yet.** Section 18 defines progress as completed-tasks/total-tasks, but
  Tasks don't exist until Phase 10 — with zero tasks that ratio is undefined, and rendering a
  fake/empty ring would violate the "nothing non-functional" rule. `ProjectCard` shows an item
  ("reference") count instead, which pulses gently on hover per Section 7.6's spec for that
  card. The ring is a straightforward addition once Phase 10 lands real task data.
- **"Recent activity" is really implemented, not stubbed** — Section 18 asks for "a lightweight
  activity feed derived from `saved_at`/`updated_at`/`completed_at` timestamps... do not build a
  separate activity-log table." `getProjectActivity` (`lib/db/saved-items.ts`) does exactly
  that: reads the project's own items' `saved_at` and renders the most recent as feed lines.
  It'll gain real teeth once Phase 10 adds `completed_at` events into the same feed.
- **"Move to project" mirrors "Move to collection"** in the card dropdown, and both pickers
  now appear together in the Save Dialog's reason step and on the Item Detail page — the
  project half of Section 5 Flow A's "optional collection/project picker" that Phase 8 had
  left for later.
- **Status defaults to "active" on create**; the status selector only appears when *editing* an
  existing project, matching the DB column's own default and keeping the create form to just
  name + description.

## Two original features, added on request (not in the master prompt)

- **Recall Radar** (`components/RecallRadarCard.tsx`, `getRadarPick` in
  `lib/db/saved-items.ts`) — shown on the dashboard home page. Every bookmarking app is
  pull-only: you get back exactly what you go looking for, nothing more. Recall's entire
  premise is "help me find it again," so once a day the dashboard proactively resurfaces one
  older (14+ days), still-active memory instead of only ever showing what's newest — the app
  occasionally doing the remembering for you, unprompted. The pick prefers items that actually
  have a "What was I thinking?" note (a bare link resurfacing is much less interesting than a
  link plus the thought behind it) and is deterministic per user per day (hashed from the date
  + user id) so it doesn't reshuffle on every page load or feel like slot-machine randomness —
  just a new one each day.
- **Memory Thread** (`components/SameDayRail.tsx`, `listSameDayItems` in
  `lib/db/saved-items.ts`) — shown at the bottom of the Item Detail page: everything else saved
  the same calendar day. This is a deliberately different signal from "Similar Saves" (Phase 7,
  which clusters by domain/type) — two things saved an hour apart often share context (the same
  research binge, the same project, the same train of thought) even when they share no domain
  or collection at all. Time-of-save turns out to be a surprisingly strong proxy for "what was I
  actually doing," and it's something no bookmarking tool surfaces today as far as we're aware.
- Both features are read-only, additive, and built entirely on data the app already
  collects — no new tables, no AI calls, no user-facing settings to configure. If either turns
  out to be more annoying than delightful in practice, they're each isolated enough
  (one component, one query function) to remove cleanly.

## Phase 10: Tasks

- **Grouping adds an "Overdue" bucket** on top of Section 16's literal "Today / Upcoming / No
  date." Not specified, but a past-due task silently sorting into "Upcoming" (a list of future
  things) would be actively misleading, and there was no ambiguity-resolution reason to leave
  it out — Section 0's "choose the simplest option consistent with the philosophy" standard
  favors the more honest grouping.
- **Completed tasks stay in their due-date group** (shown muted, struck through) rather than
  being hidden or moved to a separate "Completed" section — Section 16 doesn't describe special
  handling for them, and this is simpler than inventing a new section.
- **Checkbox micro-interaction**: the check mark morphs in with a spring (matching the
  favorite-star pattern from Phase 7), and the strike-through is a genuine width-animated line
  (`motion.span` growing left-to-right), not just a CSS `text-decoration` toggle — Section 7.6
  specifically asks for "a strike-through animation," not just a static struck state.
  - Note: a `motion.span` overlay-line uses `bg-current` sized to the text's own line height at
    50% — hasn't been checked against every possible font-metrics edge case; if a strike line
    ever looks slightly mispositioned for a particular title length, that's a CSS tweak, not a
    structural issue.
- **"Turn into task" is fire-and-forget** (`useSavedItemActions.turnIntoTask`) — doesn't
  navigate to `/app/tasks` or show a persistent confirmation, just creates the task
  silently (Item Detail's version shows a brief inline "Task created ✓" for two and a half
  seconds; the card menu's version doesn't, since a dropdown closes on select anyway and there's
  nowhere sensible to put a lingering confirmation). If this turns out to feel too silent in
  practice, the natural fix is a proper toast system — deliberately not built for one call site.
- **Real progress ring now replaces the placeholder reference-count-only view on Project cards**
  (Phase 9's decisions log flagged this as pending). Only renders when a project actually has
  tasks (`total > 0`); projects with zero tasks still show just the reference-count pulse from
  Phase 9, avoiding a 0/0 ring that would read as broken.
- **Project Detail now has a real Tasks section** (list + create/edit/delete/complete, scoped
  to that project) rather than only exposing tasks through the standalone `/app/tasks` page.
  The "Recent activity" feed also now merges task completions (`completed_at`) alongside item
  saves (`saved_at`), which is exactly what Section 18 asked for and Phase 9 had left as a
  known gap pending Task data existing.
- **`getTaskReferenceCounts` relies on RLS rather than an explicit task-id filter** — since
  `task_references` has no direct `user_id` column, its RLS policy already restricts every
  query to rows whose parent task belongs to the caller (migration 0004). A plain unfiltered
  select on that table, run under the user's own session, is already correctly scoped — no
  extra `.in("task_id", ...)` needed. Worth remembering as a pattern for any future join-table
  query: check whether RLS already does the filtering before writing it again in application
  code.

## Performance fix (user-reported): saving a link felt slow

- **Root cause**: `createSavedItem`'s URL branch awaited the full page scrape
  (`fetchUrlMetadata`, up to a 6s timeout) before the insert even happened — every link save
  paid that full latency, directly contradicting Section 4/5's "saving must be fast, never
  blocked" rule. This was a real bug, not expected behavior.
- **Fix**: the row is now inserted immediately with only cheap, synchronous, no-network
  best-guesses (hostname pattern-matching for content_type, YouTube's static thumbnail CDN for
  video thumbnails) — the actual page scrape (title, description, og:image, favicon) now runs
  in the background via `enrichUrlMetadataInBackground` and patches the row once it resolves.
  No polling on the client — Library and Item Detail already re-fetch fresh from the DB on
  every visit, so the enriched fields just appear next time either page is viewed.
- **Correctness detail worth remembering for any future background-after-response work**: the
  Supabase client (`createClient()`, which calls Next's `cookies()`) must be created
  *synchronously, before the function's first `await`* — calling it after an await point risks
  "cookies was called outside a request scope" once the code is genuinely running after the
  response has been sent. `enrichUrlMetadataInBackground` grabs the client as its very first
  line for exactly this reason.
- **Known gap, flagged for Phase 21 (Deployment)**: this fire-and-forget pattern (also used by
  `triggerEnrichment` in `lib/ai/index.ts`) relies on the Node process staying alive after the
  response is sent, which is true under `next dev` but is NOT guaranteed on serverless
  platforms — a function can be frozen mid-work once its response is returned. Before shipping
  to Vercel, both call sites need `waitUntil` (from `@vercel/functions` or Next's equivalent)
  to guarantee the background work actually completes. Noted here so it isn't forgotten by the
  time Phase 21 arrives.

## Phase 12: Search

- **Ranking + structural filters live in a Postgres function (`search_saved_items`,
  migration 0006), not assembled in the Supabase JS query builder.** `ts_rank`-based ordering
  combined with several optional filters (type, collection, project, favorites, archived,
  date range) isn't expressible through the JS client's chainable filters — it can match rows
  via `.textSearch()`, but can't also sort by computed relevance alongside that. Centralizing
  it in SQL also directly sets up Phase 14: Section 15 explicitly asks for Ask Recall's
  candidate-retrieval step to be swappable/reusable rather than hardcoded, and this function
  *is* that shared step — Ask Recall will call the same RPC for its candidate set rather than
  duplicating the query logic.
  - `security invoker` (the default, set explicitly for clarity) — the function runs as the
    calling user, so RLS on `saved_items` still applies. It never bypasses row-level security.
  - When there's no query text, `ts_rank` isn't computed at all (the ORDER BY falls back to a
    constant), so browsing with just structural filters and no search text still sorts
    sensibly by recency rather than an arbitrary/undefined rank order.
- **The header/results search input debounces at ~300ms** (`SearchBar`) — Section 20 calls for
  this explicitly as a Performance-phase item, but there was no reason to defer anything this
  cheap and directly tied to the feature being built right now.
- **Filter state round-trips through the URL** (`/app/search?q=...&type=...&collection_id=...`),
  so a search is bookmarkable/shareable and survives a page refresh — matches Section 8 listing
  `/app/search?q=` as the page's actual route shape, not just a starting query param that gets
  discarded once JS takes over.
- **No separate `/api/search` result-count or pagination yet** — same "no pagination until
  Phase 20" stance as Library/Timeline; results are capped at 100 rows server-side
  (`p_limit`) rather than paginated.

## Phase 13: AI organization

- **Built and tested only against the failure path.** This sandbox has no network and no
  OpenRouter key, so the success path (a real model response getting parsed, cached, and
  rendered) has never actually executed. The failure path (no key → `ai_status = 'failed'` →
  "AI organizing unavailable right now") is the one that runs by default and is exactly what
  Section 23 specifies. Treat the first real enrichment with a key configured as the actual
  test of the prompt, the JSON parsing, and the tag upserts.
- **One batched model call per item, not four.** `AIService` (Section 14) exposes
  `classifyItem`/`generateSummary`/`generateTags`/`suggestPossibleUse` as separate methods so a
  future provider can slot in behind that boundary — but each one independently would mean four
  round-trips (and four hits on a free-tier quota) for what is naturally a single prompt.
  `enrichItem` calls `runFullEnrichment` once and fills every field. The four interface methods
  are implemented (each delegating to that same function) so the abstraction is honest, but
  nothing in the app calls them individually — if something ever does, it would re-pay the cost
  for each call, which is worth knowing before wiring one up.
- **Free-tier model default is a guess that can go stale.** `meta-llama/llama-3.1-8b-instruct:free`
  is the built-in default; OpenRouter's free model lineup changes. Override with an
  `OPENROUTER_MODEL` env var in `.env.local` — no code change needed. Deliberately *not* added
  to `.env.example`, since Section 26 says that file should list exactly the three keys named
  there; it's documented in the README instead.
- **A missing API key is treated identically to any other AI failure** (`ai_status = 'failed'`).
  There's no separate "not configured" state — the schema's `ai_status` enum doesn't have one,
  and per Section 4 the user-facing behavior should be the same either way: the item works
  fully, and shows a quiet "AI organizing unavailable right now" note.
- **Status updates aren't pushed to the UI live.** An item goes `pending` → `processing` →
  `done`/`failed` in the background; the shimmer/result appears the next time the card or
  detail page is loaded. Same "eventual consistency, no polling" stance as the background
  metadata scrape — Supabase Realtime subscriptions would fix it, but that's real
  infrastructure for something that resolves within seconds. The one exception: the manual
  "Re-analyze with AI" button awaits the result and calls `router.refresh()` so it visibly
  updates in place, since the person just clicked and is watching.
- **AI tags are stored as `source = 'ai'` rows in `saved_item_tags`**, sharing the same
  reusable per-user `tags` table as user-added tags (Section 10). Tag names are upserted on
  `(user_id, name)`, so an AI tag matching one the user already has reuses that row instead of
  creating a duplicate. The detail page renders AI tags inside the "AI suggestion" wrapper and
  user tags separately, so the two stay distinguishable.
- **`what_was_i_thinking` is only ever read as *input* to the AI prompt, never written.**
  The user's own note is given to the model as context (it makes summaries far more relevant),
  but no code path writes to that column from AI output — Section 14's "critical honesty rule."
- **Search picks up AI summaries for free**: `search_vector` (Phase 4) already includes
  `ai_summary` at weight B as a generated column, so once enrichment populates it, plain
  full-text search covers it with no further change.

## Phase 14: Ask Recall

- **Like Phase 13, only the failure path has run.** No network or key here, so a real model
  answer has never been parsed. The first real question with a key set is the actual test of
  the prompt and the response handling.
- **Candidate retrieval matches on ANY keyword, not all.** `search_saved_items` uses
  `websearch_to_tsquery`, which ANDs terms; a whole sentence like "find the editing video I saved
  for a cinematic reel" would almost never match. `retrieveCandidates` (`lib/ai/retrieve.ts`)
  strips stopwords and filler ("find", "saved", "remember"...), joins up to 8 keywords with
  `or`, and tops up with the 20 most recent items so a vaguely worded question still has
  something to work with. Capped at 40 candidates. The stopword list is hand-rolled and English
  only; a non-English library would need a different approach.
- **Swappable as Section 15 asks**: the route calls only `retrieveCandidates()`, so a vector
  query can replace it later without touching the route or the prompt. It reuses the Phase 12
  ranked search function rather than duplicating query logic.
- **The model never sees the whole library and never returns raw ids.** It gets the pre-filtered
  candidates as a numbered list (title, domain, saved date, reason, the person's own note,
  summary, tags) and answers with list numbers. Numbers are validated (real, unique, at most 5)
  before being mapped back to items, so a hallucinated number is simply dropped.
- **Prompt-injection posture**: item text comes from scraped pages, so the prompt states it is
  data, not instructions. That's a mitigation, not a guarantee; the blast radius is small
  because the model can only choose among the caller's own items and can't take actions.
- **"No matches" and "AI unavailable" are different outcomes.** An empty library or an empty
  match list returns `matches: []` with the "We couldn't find that memory" state (both offer a
  regular-search link). Only a null model result returns the spec's "Recall couldn't answer that
  right now" message, with a button that runs the same text through normal search.
- **Results reuse `MemoryCard`**, with the model's one-line reason underneath inside the
  "AI suggestion"-style badge. The person's own "What was I thinking?" line is already shown
  on the card, which is what lets them confirm a match by eye.
- `ErrorState` gained an optional `children` slot for a custom fallback action.
- **Each question is one model call, user-initiated**, so it isn't covered by the "enrich once,
  never automatically" rule, but it does spend free-tier quota per question.

## Phase 15: Related Memories

- **The main rail is structural, not AI.** `getRelatedMemories` (`lib/db/related.ts`) scores the
  user's other active items on overlap: same collection (+3), same project (+3), each shared
  tag (+2), same AI category (+2), same source domain (+1), ties broken by recency, top 6.
  It works with no key, costs nothing, and each result shows its plain-language reasons
  ("Same collection · Shared tags: reel, grade") so it never reads as a black box. The weights
  are judgment calls and easy to retune in one constant.
- **Attribute matches are separate `.eq()` queries, not one `.or()` filter.** `ai_category` is
  free text from a model and can contain commas or parentheses, which break PostgREST's `or()`
  filter syntax. Four small parallel queries (30 rows each) avoid that entirely.
- **AI assist is optional and explicit**, per Section 14: a "Look deeper with AI" button calls
  `POST /api/ai/related`, which gathers candidates by keyword from the item's own text via
  `retrieveCandidates`, then has the model pick which genuinely relate (numbers validated
  against the candidate list, same as Ask Recall). Results appear in the labeled AI block and
  exclude anything the structural list already shows. Like Phase 13/14, only the unavailable
  path has run here.
- `AIService.findRelatedMemories` now resolves `null` on AI failure (was `string[]`) so
  "unavailable" and "nothing related" stay distinguishable, matching `answerMemoryQuery`.
- **Archived items never appear as related**, and the rail shows a quiet one-liner when nothing
  overlaps, rather than hiding, so the AI button is still reachable for a brand-new item.
- **Phase 7's "Similar Saves" and Phase 9's "Memory Thread" are separate features** that stay:
  they answer "same source" and "same day" on cards and detail pages; this answers "same
  topic/goal" by shared organization. Some overlap with Similar Saves (same source) is expected.

## Phase 16: Advanced UI animations

- **Audited against Section 7.6/7.7 first** rather than re-building things that already existed.
  Already done in earlier phases: card tilt/lift/shadow, magnetic + press-scale buttons,
  favorite star morph with glow burst, task check + strike-through, progress ring, staggered grid
  entrance and layout animation, dialog scale/blur-in, the central `useReducedMotionSafe`.
  Phase 16 added only what was missing.
- **Toasts** (`ToastProvider`) — Section 7.6's "toast confirmation" on save, and Section 23's
  "optimistic UI rolled back cleanly if the write fails." Max three on screen, `aria-live`
  region, error toasts linger longer. The provider sits outermost in the `/app` layout so
  everything (including the Save Dialog) can use it.
- **`useSavedItemActions` was silently wrong before and is fixed**: `patchItem` never checked
  `res.ok`, so a 4xx/5xx response looked like success and the optimistic change stuck. It now
  throws on non-2xx, rolls back *only the affected item* (restoring its pre-change snapshot
  rather than overwriting the whole list, which could clobber a concurrent change), and shows
  an error toast. Delete still restores the full previous list so the item returns in place.
  "Turn into task" now confirms with a toast linking to Tasks (replacing the earlier silent
  fire-and-forget noted in Phase 10).
- **Command palette** (Cmd/Ctrl+K, `cmdk` inside the existing Radix `Dialog` for focus
  trapping/a11y): live memory matches from `/api/search` (debounced 250ms, in-flight requests
  cancelled), "Search for…" and "Ask Recall: …" for the typed text, and page/action commands.
  cmdk's built-in filtering is off (`shouldFilter={false}`) because half the list is async
  results, so filtering is done by hand. **Lazy-loaded** via `next/dynamic` (Section 20) — cmdk
  and the palette only download the first time it's opened.
  - `/app/ask?q=` now pre-fills and asks immediately so the palette's Ask option works. A ref
    guard stops React StrictMode's dev double-effect from spending two AI calls.
  - On Windows/Linux Chrome and Firefox, Ctrl+K is a browser shortcut (focus the search box);
    the handler calls `preventDefault`, which normally wins while the page has focus, but a
    browser could still claim it in some setups. Cmd+K on macOS has no such conflict.
  - The header "Quick find" button is hidden below `md`. Section 22 replaces the palette with a
    full-screen search sheet on mobile — that's Phase 17.
- **Page transitions** via `app/app/template.tsx` (a template re-mounts per navigation; a
  layout doesn't): fade + small vertical shift, collapsing to a plain fade under reduced
  motion. **Enter-only** — App Router has no clean hook for exit animations on route change.
  The header lives in the layout so only page content transitions.
- **Tag editor** (`TagEditor`, `POST/DELETE /api/items/[id]/tags`) — Section 7.6 asks for chips
  that pop in and shrink out, which exposed that there was no way for a person to add their own
  tags at all (only AI could). Chips spring in, shrink-and-fade out, optimistic with rollback.
  Tags are reusable per user; removing one deletes only the link, not the tag. Adding a tag
  the AI already suggested upgrades that link to `source = 'user'`. Tags aren't in
  `search_vector`, so they don't affect plain search yet (Ask Recall does see them).
- Small Section 7.6 details: card action row now slides as well as fades; collection icons glow
  in their accent color on hover; project reference counts pulse rather than just scale up.
- **Deliberately not done**:
  - *Save "flies" into the library*: the Save Dialog's scale/fade-out plus the toast (with a
    View link) is the approximation. A true fly-to-target needs shared layout between the
    dialog and the library entry, and the destination isn't on screen on most pages.
  - *Shared-element card → detail transition*: Section 7.7 says "where feasible." The card and
    detail page are different routes with different DOM; done properly this needs the View
    Transitions API or a layout-id scheme across route boundaries. Skipped rather than faked.
  - *Archive/delete icon morphs*: archive is a toggle with a label change, delete is a two-step
    confirm; adding morph animation to both would be decoration without new information.

## AI diagnostics + a real bug fix (user-reported: "AI doesn't seem to work")

- **Root cause, found while investigating**: for every URL save, AI enrichment and the
  background metadata scrape fired in parallel from the same request. Enrichment usually won
  the race and read the row before the scrape had filled in title/description — so the model
  was very often being asked to categorize a bare URL with no title, description, or context at
  all. This wasn't a "silent AI failure," it was AI running on effectively empty input every
  time. Fixed by having the metadata scrape trigger enrichment itself once it finishes (success
  or failure, via `finally`), instead of both firing independently from the API route.
  Note/image/file saves have everything up front and still enrich immediately.
- **The bigger problem was that failures were silent.** `callOpenRouterJSON` swallowed every
  failure into a bare `null`, so an invalid key, no credits, a retired free model, or a rate
  limit were all completely indistinguishable from each other — and from working correctly with
  nothing to summarize. There was no way to answer "why isn't this working" without editing code.
  Fixed with three changes:
  - `callOpenRouterJSON` was split into a lower-level `callOpenRouter` that returns a
    typed reason on failure (`no_key`, `invalid_key`, `no_credits`, an HTTP status, a timeout,
    or a network error) and logs it server-side prefixed `[recall:ai]`, never logging the key
    itself.
  - **Automatic fallback across free models**: OpenRouter's free lineup changes and any one
    model can be retired or rate-limited without notice. Up to 4 models are tried in order
    (`OPENROUTER_MODEL` first if set, then three built-in fallbacks) — but only for
    "this model isn't available/rate-limited/erroring" failures. A bad key or no credits stops
    immediately, since switching models wouldn't fix either.
  - **`GET /api/ai/health`**, backing a real "AI" section on a new `/app/settings` page: makes
    one tiny real request and reports success or a plain-English reason with a specific next
    step (e.g. "OpenRouter rejected the key — re-copy it from openrouter.ai/keys, no quotes or
    spaces"). This is the intended first stop for "is AI working, and if not, why."
- **Settings didn't exist as a phase** in the master prompt's 21-phase breakdown (Section 8
  lists the page; Section 30's phase list doesn't assign it a number). Rather than build the
  full Profile/Appearance/AI-Preferences/Data-and-Privacy page implied by Section 8, this adds
  only the one section actually needed right now — clearly scoped as a starting point, not
  a claim that Settings is done as a phase.

## Phase 17: Responsive design

- **Replaced the single-row header nav with Section 22's actual split**: `AppSidebar` (persistent,
  collapsible to icon-only, `hidden md:flex`) for desktop/tablet, `BottomTabBar` (`md:hidden`,
  fixed) for mobile — not the same nav just shrunk, a genuinely different layout per breakpoint,
  which is what Section 22 asks for ("Mobile is a distinct, intentional layout, not a squeezed
  desktop"). The old 8-link horizontal row would have wrapped or overflowed on a phone.
- **Sidebar collapse is user-controlled and persisted** (localStorage), not auto-switched by
  breakpoint — the choice sticks across sessions instead of being re-decided by window width
  every visit. A brief `invisible` state avoids a flash of the wrong width before localStorage
  is read on mount.
- **Bottom tab bar follows the master prompt's own example set** ("Home, Library, Save,
  Timeline/Search, Profile") with a "More" sheet for the rest — there are more top-level
  sections than fit in 5 tabs, and More stands in for "Profile" (account email + sign out) since
  there's no dedicated profile page. `signOutAction` is passed down as the real Server Action
  from `lib/auth/actions`, invoked via an actual form submission rather than a bare onClick —
  matching the header's own sign-out exactly, since that's the path already known to work with
  the redirect() inside it.
- **Every dialog is now a bottom sheet on mobile, a centered modal at `sm:` and up** (`Dialog.tsx`)
  — Section 22's explicit "Save flow opens as a full-screen sheet rather than a centered modal"
  requirement, applied to every dialog built on the shared primitive (Save, Collection/Project/
  Task forms, the "More" sheet) for free, plus a drag-handle affordance shown only on the sheet.
  **Consumers must use `sm:max-w-*`, not plain `max-w-*`, to set their desktop width** — the
  base component's mobile styles need to stay in control of sheet sizing, so a same-breakpoint
  override (`sm:` on both sides) is what actually wins; a plain `max-w-*` from a consumer would
  only affect the mobile sheet, not the desktop size that was probably intended. All four
  existing form dialogs were updated to this convention; worth remembering for any future one.
- **Command palette becomes a tall bottom sheet on mobile** rather than a fully custom
  edge-to-edge layout — Section 22 calls for "a full-screen search sheet," and a tall sheet
  (`max-h-[90vh]`) reads as that in practice on a phone screen without needing bespoke
  full-bleed positioning I can't visually verify in this environment. Restores the centered
  popover only at `sm:` and up.
- **Real bug found and fixed while working on this**: every card's favorite/archive/"more" menu
  only appeared on `:hover`, which doesn't exist on touch devices — those buttons would have
  been completely unreachable on mobile, not just harder to find. Fixed with a shared
  `.card-actions` CSS rule (`globals.css`) scoped to `@media (hover: hover)`: visible by default,
  hidden-until-hover only on devices that report real hover support. Applied to MemoryCard,
  CollectionCard, and ProjectCard — the three places this pattern existed.
- **Added the root `viewport` export** (`viewportFit: "cover"`) — without it,
  `env(safe-area-inset-bottom)` (used by `BottomTabBar` to clear the home indicator) resolves to
  0 rather than the device's actual inset, silently doing nothing on notched phones.
- **Deliberately not done**: hover-to-play video previews (Phase 7) stay hover-only rather than
  triggering on tap on touch devices — autoplaying video on a mobile data connection just
  because someone tapped a card once seemed like the wrong default, and tapping still opens the
  full detail page either way. Grids (Library/Collections/Projects) already collapsed to a
  single column below `sm` as far back as Phase 7/8/9, so no change was needed there.

## Phase 18: Accessibility

- **Computed actual WCAG contrast ratios rather than eyeballing hex codes** (Section 21
  requires AA in both themes). Found real failures: `text-muted` failed AA against every
  background in both themes; `accent` and `warning`, used as fills, also get used as *text*
  (links, labels) elsewhere in the app and failed the stricter 4.5:1 text threshold in light
  mode specifically. Fixed `text-muted` directly in both themes. For accent, splitting the
  token was the correct fix rather than darkening `--accent` itself: it's also a *button fill*
  with dark text on top, and darkening it to pass as text would have broken that pairing in the
  other direction. Added `--accent-text` (light theme only needs a different value; dark
  theme's existing accent already cleared 4.5:1 as text) and repointed all 25 existing
  `text-accent` usages to `text-accent-text` — `bg-accent`/`border-accent`/`ring-accent` were
  left untouched since those are the fill/border use. `warning` isn't used as text anywhere
  yet, so it's untouched but noted here: fix it before ever using `text-warning` for real text.
- **`buttonStyles` — used by every button in the app — removed the focus outline with no
  replacement at all.** `focus-visible:outline-none` with nothing filling the gap means no
  visible focus indicator on any button, anywhere, for keyboard users. The textarea in
  WhatWasIThinking and both EditableTitle input variants had the identical bug. All four fixed
  with `focus-visible:ring-2 focus-visible:ring-accent` — no ring-offset, deliberately: buttons
  render on several different surface colors (bg-0 through bg-3) depending on context, and an
  offset ring's gap shows the *offset color*, which would mismatch whatever surface a button
  actually sits on without knowing that in advance.
- **`EditableTitle`'s non-editing state was mouse-only** — a clickable heading with an onClick
  and no keyboard path whatsoever (no role, no tabIndex, no key handler). Fixed with
  `role="button"`, `tabIndex={0}`, `aria-label`, and Enter/Space handling.
- **`TaskCard`'s checkbox had `role="checkbox"` with no accessible name at all** — fixed with
  an `aria-label` stating the task title and the action.
- **Collection form's icon and color-swatch pickers**: the color swatches were empty divs with
  only a `title` (not reliably exposed to screen readers) and no `aria-label` or pressed state;
  fixed both the icon and color pickers with `aria-label` + `aria-pressed`.
- **Skip-to-content link** added as the very first focusable element in the `/app` layout — a
  keyboard user can jump straight past the sidebar/header to page content instead of tabbing
  through the same nav on every page.
- **`aria-live` added where state changes without a page reload**: `LoadingState`
  (`role="status"`) and `ErrorState` (`role="alert"`), plus explicit result-count announcements
  in Search and Library — Section 21's own named example ("search results count changes").
  The Search one is conditional on `!loading` specifically — `LoadingState` already announces
  "Searching…" itself, so a second always-rendered live region would have double-announced the
  same moment.
- **Already in place from earlier phases**, confirmed rather than rebuilt: semantic landmarks
  (`header`/`main`/`nav`/`aside`), ARIA labels on every icon-only button built since Phase 7
  (`IconActionButton` requires a `label` prop by its own type signature), Radix's own
  dialog/menu accessibility (focus trap, `Escape`, ARIA roles), and global
  `prefers-reduced-motion` handling (`useReducedMotionSafe`, used throughout since Phase 2).
- **Not independently re-verified**: screen-reader behavior and real contrast rendering, since
  this environment has neither a screen reader nor a browser to check against. The contrast
  fixes are backed by the actual WCAG relative-luminance formula computed above, not a guess —
  but seeing it rendered is still worth doing once you can.

## Phase 19: Performance

- **Library and Timeline were loading the entire table on every visit** — `listSavedItems` had
  no limit at all. Added cursor-based pagination (`listSavedItemsPage`, cursor = previous
  page's last `saved_at`) and infinite scroll (`LoadMoreSentinel`, an IntersectionObserver
  with 200px rootMargin so the next page starts loading just before the user hits bottom).
  Both pages now load 30 items initially instead of everything.
- **Filters apply to whatever's loaded so far, not the whole library.** This is the honest
  trade-off of client-side filtering plus pagination: a filter like "Favorites" on Library
  might show fewer results than truly exist until more pages are scrolled in. Fixing this
  properly means moving filtering server-side (into `listSavedItemsPage`'s WHERE clause), which
  is a bigger change than this pass — flagged here rather than silently shipped as if it
  weren't a trade-off.
- **"Similar Saves" counts (Phase 7) are similarly scoped to loaded items only** post-pagination
  — same trade-off, same reasoning, not a separate issue.
- **Search (Phase 12) already paginates correctly and isn't affected** — it was always a
  bounded, server-side query (`p_limit`) through the ranked search function, never a full-table
  load.
- **Code-splitting**: Next.js's App Router already code-splits per route automatically, so every
  page (`/app/ask`, `/app/search`, etc.) was already its own chunk without any manual work. The
  one thing that needed manual splitting was the Command Palette (Phase 16) — not a route, a
  global overlay living in the layout — which already uses `next/dynamic`. Nothing else in the
  app is both global-to-every-page and heavy enough to be worth the added complexity of
  splitting it out.
- **Images**: already using plain `<img loading="lazy">` rather than `next/image` (a Phase 7
  decision, kept — see that entry for why: natural aspect ratio without `next/image`'s
  `fill`-mode cropping). Found and fixed one spot in `MediaPreview`'s video-poster branch that
  was missing `loading="lazy"`; the plain-image branch already had it.
- **AI results already cache permanently** (Phase 13's `ai_status`/`ai_category`/etc.) and were
  never recomputed on read — nothing to change there, Section 20's requirement was already met.
- **Landing page**: no below-the-fold lazy-loading added — the current landing page is a single
  hero section with nothing below the fold yet to lazy-load. Worth revisiting if the landing
  page grows additional sections later.
- **Not verified**: Section 20 asks to confirm 60fps for the tilt/ambient effects "on a
  mid-range laptop" — there's no browser in this environment to actually measure that. The
  effects are already CSS-transform-based (not layout-triggering properties), which is the
  right foundation, but the frame-rate claim itself is unverified.

## Bug-fix pass (user-reported, 9 issues)

1. **Inline Collection/Project/Task creation in Save dialog** — select now offers
   "+ New collection…"/"+ New project…", switching to an inline name field; creating selects
   it immediately. A separate "+ New task for this" creates a task linked back to the item
   (reuses the existing task_references pattern from "Turn into task").
2. **Favicon** — `app/icon.svg`, auto-detected by Next.js App Router, no metadata config needed.
3. **Back button** — new `BackButton` component (real browser history when same-origin
   referrer + history exists, else a fallback route) on Item/Collection/Project detail pages.
4. **AI stuck on "Processing" — root cause found and fixed.** `enrichItem` was creating its
   Supabase client via `cookies()` several async hops after the original request (after the
   metadata scrape's real network latency), a point where Next's request-scoped cookie context
   can be unreliable. If the subsequent select-by-id then came back empty, the code did
   `return { ok: false }` **without ever marking the row failed** — permanently stuck at
   "processing," not a timeout, not a key issue. Fixed three ways: (a) background jobs
   (`enrichItem`, `enrichUrlMetadataInBackground`) now use a new service-role client
   (`lib/supabase/service.ts`) that needs no request-scoped cookies at all — appropriate since
   the item/user ownership was already established when the row was created; (b) the silent
   early-return now calls `markFailed`; (c) `lib/ai-status.ts` adds staleness detection
   (`updated_at` touched when 'processing' is set) so even an already-stuck historical row
   self-heals in the UI (shows "unavailable" + working Re-analyze) without a manual DB fix.
   **New required env var**: `SUPABASE_SERVICE_ROLE_KEY`.
5. **Search missing partial/substring matches** — root cause: full-text search
   (`websearch_to_tsquery`) matches whole stemmed lexemes only; it fundamentally cannot do
   partial-word matching, which is what the reported case needed. Migration `0007` adds a
   case-insensitive `ILIKE` fallback OR'd with the existing full-text match, and expands
   coverage to tags, collection name, and project name (none were searchable before).
6. **Ask Recall returned nothing when AI was unavailable**, discarding the DB candidates it
   had already retrieved. Now falls back to returning those candidates directly
   (`aiUnavailable: true`), so relevant memories still appear with no "why" explanation
   rather than a hard error.
7. **Search fallback order** — satisfied by #5's combined query (full-text OR ILIKE OR
   tag/collection/project match in one round-trip) plus #6 (Ask Recall degrading to DB
   results). Not literally sequential fallback queries, which would cost more round-trips for
   the same result.
8. **Forgot/reset password — root cause found and fixed.** Supabase's recovery email commonly
   delivers the session as a URL **hash fragment** (`#access_token=...`), which is never sent
   to the server at all — the previous Server-Action-based submit had no session to act on
   regardless of `/auth/callback` configuration. `/app/reset-password` now submits via the
   browser Supabase client (which auto-detects the hash fragment and also reads a
   cookie-based session from the `?code=` flow), handling both delivery mechanisms, with an
   explicit "this link isn't valid" state for expired/already-used links.
9. **Targeted QA** — reviewed (not re-tested live) the request/response shape of every route
   touched by 1–8 for consistency with existing callers; did not re-audit unrelated flows
   (login/logout, favorites, archive) since they weren't implicated in any reported bug and
   touching them wasn't requested.

**None of this was executed against a live browser or Supabase project** — no network in this
environment. Every fix is logically traced and internally consistent, not click-tested.

## TypeScript build fixes (user ran `npm run build` / `npx tsc --noEmit`)

`tsc` caught 11 real errors across 5 files that `next dev` never surfaces, since dev mode
doesn't type-check on every request. Two categories:

- **`noUncheckedIndexedAccess` (set in `tsconfig.json` since Phase 1) treats every array index
  access as possibly `undefined`**, even for a known-non-empty const array or an index computed
  to always be in range. Hit this in `CollectionFormDialog` (preset array defaults),
  `lib/db/saved-items.ts` (Recall Radar's hashed pick, pagination's last-item cursor), and
  `lib/metadata.ts` (destructured IP octets). Fixed with real fallback values (`?? null`,
  `?? "#E3A548"`) rather than non-null assertions — keeps the code honest about the
  theoretical case even where it can't actually occur.
- **Two silent no-op edits from the previous bug-fix pass**: `BackButton` was used in
  `ProjectDetailView` without ever being imported, and `createServiceClient`/`triggerEnrichment`
  were used in `lib/db/saved-items.ts` without being imported either. Root cause: those earlier
  edits used plain `str.replace()` for the import-line insertion without asserting the pattern
  actually matched, while the *usage* insertion right next to it was asserted — so when the
  import pattern didn't match exactly (different icon in the lucide import list; import combined
  with a different line than assumed), the usage landed but the import silently didn't, and
  nothing caught it until a real type-check. Every `str.replace()` used for a code edit should
  assert the match, no exceptions — the asserted half working while the unasserted half silently
  no-ops is exactly how this slipped through.
- Also fixed: a Supabase joined-select (`task_references → saved_items`) whose inferred TS shape
  didn't match the real one closely enough for a direct cast — needs a `through unknown` hop.

All 11 are fixed; none required a schema or architecture change, just correct guards/imports.

## Password reset redirecting to login instead of the reset form (user-reported)

Real bug in `middleware.ts`, not a Supabase dashboard setting. `/reset-password` was listed in
`AUTH_PAGES`, the set of pages a *logged-in* user gets redirected away from back to `/app`.
But clicking the recovery email link genuinely establishes a session — that's how Supabase
recovery works — so a person arriving to set a new password looked, to middleware, exactly
like "a logged-in user visiting an auth page," and got bounced straight to `/app` before ever
seeing the reset form. This explains the exact symptom reported: the link "gives direct login
access" instead of a password form. Fixed by excluding `/reset-password` from that list —
safe to do unconditionally, since the page itself already verifies a genuine recovery session
exists (Issue 8's earlier fix) and shows "this link isn't valid" otherwise.

## Deployment readiness: waitUntil fix + Data & Privacy (Section 27)

- **The real pre-deploy blocker, now fixed**: every background job (AI enrichment, URL
  metadata scraping) used bare `void fn()` fire-and-forget, which only works because
  `next dev` is a long-running process. On Vercel, a serverless function can be frozen the
  instant its response is sent — silently killing that work mid-flight. Fixed with
  `@vercel/functions`' `waitUntil()` (no-ops safely when not running on Vercel, so local dev
  is unaffected) at all three call sites, with `triggerEnrichment` changed from `void` to
  `await` internally so a single `waitUntil()` at the outermost call covers the whole chain
  (metadata scrape → AI enrichment) transitively instead of needing it at every nested level.
- **Data export + account deletion built** (`lib/db/export.ts`, `/api/export`,
  `/api/account/delete`, `DataPrivacySection` on Settings) — Section 27 functionality that
  Phase 20's own testing checklist expected to exist but hadn't been built yet. JSON export
  carries the full relational structure; CSV flattens to one row per saved item (collection/
  project names and tags joined in as columns) since CSV can't naturally represent several
  related tables — noted as a deliberate interpretation, not an oversight. Account deletion
  uses the service-role client (from the earlier bug-fix session) since deleting an
  `auth.users` row requires the Admin API — a user's own session can never delete itself.
  Cascades via the `on delete cascade` FKs already in migration 0001; Storage objects are
  removed separately since SQL cascades don't reach them.
