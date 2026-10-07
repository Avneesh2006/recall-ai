-- Recall content understanding: keep the actual extracted/AI-understood content
-- separate from user-authored context. This lets Search and Ask Recall find
-- memories by what was actually inside the saved media/document.
alter table saved_items
  add column if not exists source_media_url text,
  add column if not exists content_text text,
  add column if not exists ai_content text;

-- Expand the generated search vector to include extracted content and AI understanding.
drop index if exists saved_items_search_idx;
alter table saved_items drop column if exists search_vector;
alter table saved_items add column search_vector tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(what_was_i_thinking,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(ai_summary,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(ai_content,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(content_text,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'C') ||
  setweight(to_tsvector('english', coalesce(source_domain,'')), 'D')
) stored;

create index if not exists saved_items_search_idx on saved_items using gin (search_vector);
