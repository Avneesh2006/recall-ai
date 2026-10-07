# Recall

Don't just save what you found. Remember why you saved it.

## Status

Build in progress, following the phase order in the master prompt. Completed so far:

- **Phase 1 — Project setup**: Next.js 14 (App Router) + TypeScript + Tailwind scaffolded,
  folder structure in place, lint/format configured.
- **Phase 2 — Design system**: design tokens (`lib/design-tokens.ts` + CSS variables), base
  primitives (`GlassPanel`, `AnimatedButton`, `Tilt3DCard`), dark/light theme switching,
  ambient background.
- **Phase 3 — Authentication**: Supabase Auth wired end-to-end (signup, login, logout, forgot
  password, reset password), protected route middleware, email confirmation / reset callback
  route.
- **Phase 4 — Database**: all tables, the full-text search column, and indexes from Section 10
  as versioned SQL migrations under `supabase/migrations/`.
- **Phase 5 — RLS**: policies applied to every user-owned table (`supabase/migrations/0004_rls_policies.sql`).
  **You must run the two-user isolation test in `TESTING.md` yourself** — it needs a real
  Supabase project this sandbox can't reach.
- **Phase 6 — Save system**: Save Dialog for URL / note / image / file, server-side metadata
  fetching with SSRF protections, reason chips + "What was I thinking?" capture, Supabase
  Storage wiring for uploads, and the AI-enrichment trigger stub. Press **S** anywhere in
  `/app` (or click "Save something") to try it.
- **Phase 7 — Library**: `/app/library` — filterable/sortable grid of Memory Cards with 3D
  tilt-on-hover, favorite/archive/delete (optimistic, with undo-on-failure), and a full Item
  Detail page (`/app/item/[id]`) for editing the reason/note after the fact. Empty and
  no-results states included.
- **Card upgrades**: hover over a video card to play a real inline preview (YouTube/Vimeo/
  uploaded files) instead of clicking through; click any title to rename it in place; images
  and videos now render at their true aspect ratio (vertical Reels/Shorts get a portrait frame,
  nothing gets cropped); cards develop a warm "amber patina" the longer they've sat unrevisited;
  and a "similar saves" pill flags when you've saved something from the same source before.
  Also fixed: uploaded videos now get a real thumbnail (captured from the video itself), and
  Instagram/YouTube link saves now correctly get tagged and thumbnailed even when the source
  page blocks metadata scraping (common for Instagram).
- **Phase 8 — Collections**: `/app/collections` and `/app/collections/[id]` — named, icon +
  color spaces to group saved items. Create/edit/delete, move an item in or out from its card's
  "more" menu (or from the Item Detail page), and pick a collection right at save time.
- **Phase 9 — Projects**: `/app/projects` and `/app/projects/[id]` — goal-oriented containers
  with a status (Active/Completed/Archived) and a real recent-activity feed. Move items in/out
  the same way as Collections; a progress ring will appear here once Tasks (Phase 10) exist.
- **Two original features**: **Recall Radar** on the dashboard resurfaces one older, forgotten
  memory each day instead of only ever showing what's newest. **Memory Thread**, at the bottom
  of every Item Detail page, shows everything else you saved that same day — a time-based
  companion to the domain-based "Similar Saves" from Phase 7.
- **Phase 10 — Tasks**: `/app/tasks` — lightweight tasks grouped by due date (Overdue/Today/
  Upcoming/No date), with a real animated checkbox-and-strikethrough completion interaction.
  "Turn into task" now works from any saved item (card menu or Item Detail), auto-linking back
  to the source. Projects gained a real animated progress ring (completed/total tasks) and a
  built-in Tasks section right on the Project Detail page, plus task completions now feed into
  that project's activity log.
- **Performance fix**: saving a link previously waited on the full page-scrape (up to 6s)
  before responding at all. It now saves instantly and enriches the title/thumbnail in the
  background — see DECISIONS.md for the fix and a flagged follow-up needed before deployment.
- **Phase 11 — Timeline**: `/app/timeline` — reverse-chronological feed grouped by Today/
  Yesterday/day-of-week/date, with date-range filtering (All time/Today/This week/This month/
  custom range). Hover any entry for its exact saved timestamp.
- **Phase 12 — Search**: `/app/search?q=` — real ranked full-text search (Postgres
  `websearch_to_tsquery` + `ts_rank`, run via a `search_saved_items` DB function) across title,
  your "What was I thinking?" note, AI summary, description, and source domain, combinable with
  type/collection/project/favorites/archived/date-range filters. One new migration
  (`0006_search_function.sql`) — run it before trying this out.
- **Phase 13 — AI organization**: every new save gets a category, one-line summary, tags, and a
  "possible use" suggestion, generated once via OpenRouter and cached — always shown inside a
  clearly labeled "AI suggestion" block, visually separate from your own "What was I
  thinking?" note. Use "Re-analyze with AI" on any item's detail page to run it again on
  demand. **To turn it on**, put a free key from [openrouter.ai](https://openrouter.ai) in
  `.env.local` as `OPENROUTER_API_KEY`. Without one, everything else works normally and items
  just show "AI organizing unavailable right now." Optionally set `OPENROUTER_MODEL` to pick a
  different model if the default free one is retired.
- **New required env var: `SUPABASE_SERVICE_ROLE_KEY`** — Supabase dashboard → Project
  Settings → API → `service_role` key (NOT the `anon` key). Used only server-side, for
  background AI/metadata jobs — see DECISIONS.md for why. Never commit it.
- **Phase 14 — Ask Recall**: `/app/ask` — describe what you remember ("the editing video I saved
  for a cinematic reel") instead of its title. Recall narrows your own items with full-text
  search, has the AI pick the best few, and shows each as a card with a one-line reason next to
  your original "What was I thinking?" note. Needs the same `OPENROUTER_API_KEY`; without one it
  offers a regular search instead. No new migrations.
- **Phase 15 — Related Memories**: every Item Detail page now has a "Related memories" list —
  your other items that share its collection, project, tags, AI category, or source, each with
  the reason it was picked. An optional "Look deeper with AI" button finds topical matches the
  structure misses (labeled as AI; needs the OpenRouter key). No new migrations.
- **Phase 16 — Advanced UI animations**: press **Cmd/Ctrl+K** anywhere in the app to search
  memories, jump to any page, ask Recall, or start a save. Pages now fade in on navigation,
  saves and other actions confirm with a toast (and failed changes roll back with a calm error
  instead of silently sticking), and detail pages have a tag editor with pop-in/shrink-out
  chips so you can add your own tags. No new migrations.
- **AI diagnostics + a real fix**: for URL saves, AI enrichment used to run before the
  background metadata scrape finished, so it was very often analyzing a bare link with no
  title or description — fixed by sequencing enrichment to run only after metadata lands. AI
  failures are also no longer silent: check **Settings → AI** (`/app/settings`) for a live
  status check with a specific reason and next step if something's wrong, and the terminal now
  logs `[recall:ai]` lines on every failure. The client also automatically tries a few other
  free models if the configured one is unavailable. No new migrations.
- **Deployment readiness**: background AI/metadata jobs now use `waitUntil` so they reliably
  complete on serverless (previously could be silently killed on Vercel specifically) — the
  one real pre-deploy blocker, now resolved. Data export (JSON/CSV) and account deletion are
  live under Settings. One new dependency: `@vercel/functions`.
- **Phase 17 — Responsive design**: desktop/tablet now has a persistent, collapsible sidebar
  instead of a cramped header nav row; mobile gets a genuinely different bottom-tab layout
  (Home, Library, a prominent center Save button, Search, More) instead of a squeezed version
  of the same thing. Every dialog — Save, Collection/Project/Task forms, the command palette —
  opens as a bottom sheet on phones and a centered modal on larger screens. Also fixed: card
  action buttons (favorite/archive/etc.) were hover-only and completely unreachable on touch
  devices; they now show by default on devices without real hover support. No new migrations.
- **Phase 18 — Accessibility**: fixed real contrast failures (computed with the actual WCAG
  formula, not eyeballed) in both themes, restored a focus ring that had been accidentally
  removed from every button in the app, made the click-to-rename title keyboard-operable, added
  a skip-to-content link, and added screen-reader announcements for loading/error states and
  search/library result counts. No new migrations.
- **Phase 19 — Performance**: Library and Timeline now load 30 items at a time with infinite
  scroll instead of loading your entire history on every visit. No new migrations.

See `DECISIONS.md` for assumptions made along the way, and the master prompt for the full
phase list and definition of done.

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the migrations**: Supabase Studio → SQL Editor → paste and run each file in
   `supabase/migrations/` **in order** (`0001` through `0007`). If you've already run some of
   these before, you only need to run whichever ones are new since your last pull — `0007`
   (search fallback) is the newest.
3. **Set your Site URL and redirect URL**: Supabase Studio → Authentication → URL Configuration
   → Site URL = `http://localhost:3000`, and add `http://localhost:3000/auth/callback` to
   Redirect URLs. (Update these to your real domain when you deploy.)
4. **Copy your keys**: Supabase Studio → Project Settings → API → copy the Project URL and
   `anon public` key.

```bash
npm install
cp .env.example .env.local   # paste in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Requires Node 18.18+. `OPENROUTER_API_KEY` isn't needed yet — that's wired up in the AI
enrichment phase.

Try the full loop: sign up → check your email for the confirmation link → log in → you should
land on `/app` and see a welcome message using your profile's `display_name` (proof the
signup trigger created your `profiles` row correctly).

## Stack

- Next.js 14 (App Router, Server Components), TypeScript
- Tailwind CSS + Radix UI primitives + Framer Motion
- Supabase (Postgres, Auth, Storage) — added in Phase 3–5
- OpenRouter for AI enrichment — added in Phase 13

## Folder structure

```
/app          routes (App Router)
/components   reusable UI components
/features     feature-scoped composition (save, library, timeline, ...)
/lib          /db, /ai, /auth, /validation, design-tokens.ts
/hooks        shared React hooks
/types        shared TypeScript types
/styles       globals.css
/supabase     /migrations
```
