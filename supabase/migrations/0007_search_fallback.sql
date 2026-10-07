-- Fixes: "Searching 'English' for content containing 'English in Hindi
-- song' returns nothing" (user-reported). Root cause: the search relied
-- entirely on websearch_to_tsquery, which matches whole stemmed lexemes
-- only — it cannot do partial/substring matching, and single-word
-- natural-language queries can miss in edge cases full-text search
-- isn't built for. This adds a case-insensitive substring (ILIKE)
-- fallback, OR'd with the existing full-text match, and expands
-- coverage to tags, collection name, and project name (none of which
-- were searchable at all before).
--
-- ts_rank is kept for ordering when the full-text side actually
-- matches; pure-ILIKE matches (that don't also match full-text) sort by
-- recency, same as a query-less browse.

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
  select si.*
  from saved_items si
  where si.user_id = p_user_id
    and (p_input_type is null or si.input_type = p_input_type)
    and (p_collection_id is null or si.collection_id = p_collection_id)
    and (p_project_id is null or si.project_id = p_project_id)
    and (not p_favorites_only or si.is_favorite = true)
    and (p_include_archived or si.is_archived = false)
    and (p_date_from is null or si.saved_at >= p_date_from)
    and (p_date_to is null or si.saved_at <= p_date_to)
    and (
      p_query is null or p_query = ''
      or si.search_vector @@ websearch_to_tsquery('english', p_query)
      or si.title ilike '%' || p_query || '%'
      or si.description ilike '%' || p_query || '%'
      or si.what_was_i_thinking ilike '%' || p_query || '%'
      or si.ai_summary ilike '%' || p_query || '%'
      or si.ai_category ilike '%' || p_query || '%'
      or si.source_domain ilike '%' || p_query || '%'
      or si.url ilike '%' || p_query || '%'
      or exists (
        select 1 from saved_item_tags sit
        join tags t on t.id = sit.tag_id
        where sit.saved_item_id = si.id and t.name ilike '%' || p_query || '%'
      )
      or exists (
        select 1 from collections c
        where c.id = si.collection_id and c.name ilike '%' || p_query || '%'
      )
      or exists (
        select 1 from projects p
        where p.id = si.project_id and p.name ilike '%' || p_query || '%'
      )
    )
  order by
    (case
      when p_query is not null and p_query <> ''
      then ts_rank(si.search_vector, websearch_to_tsquery('english', p_query))
      else 0
    end) desc,
    si.saved_at desc
  limit p_limit;
$$;
