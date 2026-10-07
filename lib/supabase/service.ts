import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS entirely. Server-only; the
 * key must never reach the client bundle or be logged.
 *
 * Used specifically for background jobs (AI enrichment, the URL
 * metadata scrape) that run detached from the original request, often
 * well after real network I/O has elapsed. Those jobs were previously
 * using the cookie-based client (lib/supabase/server.ts), which re-reads
 * Next's request-scoped cookies() on every call — fragile several async
 * hops after the request that's long since responded, and the likely
 * root cause of items getting stuck on ai_status = 'processing'
 * forever (see DECISIONS.md). This client needs no request context at
 * all: the item/user ids were already established when the row was
 * created, so re-deriving "who is the current user" from cookies isn't
 * actually needed for an update-by-known-id — this is the legitimate
 * "trusted server-side code" use of the service role per Section 19.
 *
 * Never use this to answer "what can this user see" — only for
 * system-initiated writes to a row whose ownership is already known.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase dashboard → Project Settings → API → service_role key). Never commit it or expose it to the client.",
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
