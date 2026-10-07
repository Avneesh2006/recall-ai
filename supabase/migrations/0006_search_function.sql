-- Ranked full-text search over saved_items, combined with the same
-- structural filters the Library/Search UI already supports. Centralized
-- here (rather than assembled client-side) because ranking by ts_rank
-- alongside several optional filters isn't something the Supabase JS
-- query builder can express directly.
--
-- security invoker (the default for a plain function, set explicitly
-- here for clarity) means this runs as the calling user — RLS on
-- saved_items still applies. This function never bypasses RLS.
--
-- Section 15 asks for the candidate-retrieval step behind Ask Recall
-- (Phase 14) to be swappable/reusable rather than hardcoded — this
-- function is exactly that shared step, used by both plain Search
-- (Phase 12) and, later, Ask Recall's candidate gathering.

create or replace function search_saved_items(
  p_user_id uuid,
  p_query text default null,
  p_input_type text default null,
  p_collection_id uuid default null,
  p_project_id uuid default null,
  p_favorites_only boolean default false,
  p_include_archived boolean default false,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_limit int default 100
)
returns setof saved_items
language sql
stable
security invoker
as $$
  select *
  from saved_items
  where user_id = p_user_id
    and (p_input_type is null or input_type = p_input_type)
    and (p_collection_id is null or collection_id = p_collection_id)
    and (p_project_id is null or project_id = p_project_id)
    and (not p_favorites_only or is_favorite = true)
    and (p_include_archived or is_archived = false)
    and (p_date_from is null or saved_at >= p_date_from)
    and (p_date_to is null or saved_at <= p_date_to)
    and (
      p_query is null or p_query = ''
      or search_vector @@ websearch_to_tsquery('english', p_query)
    )
  order by
    (case
      when p_query is not null and p_query <> ''
      then ts_rank(search_vector, websearch_to_tsquery('english', p_query))
      else 0
    end) desc,
    saved_at desc
  limit p_limit;
$$;
