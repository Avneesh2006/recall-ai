-- Full-text search column + indexes.

alter table saved_items add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(what_was_i_thinking,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(ai_summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(source_domain,'')), 'D')
  ) stored;

create index saved_items_search_idx on saved_items using gin (search_vector);

create index saved_items_user_saved_at_idx on saved_items (user_id, saved_at desc);
create index saved_items_user_collection_idx on saved_items (user_id, collection_id);
create index saved_items_user_project_idx on saved_items (user_id, project_id);
create index saved_items_user_favorite_idx on saved_items (user_id, is_favorite);
create index saved_items_user_archived_idx on saved_items (user_id, is_archived);

create index tags_user_name_idx on tags (user_id, name);

create index tasks_user_id_idx on tasks (user_id);
create index tasks_project_id_idx on tasks (project_id);
create index collections_user_id_idx on collections (user_id);
create index projects_user_id_idx on projects (user_id);
