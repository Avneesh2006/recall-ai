-- Recall v1 schema — Section 10 of the master build prompt.
-- Run in order: 0001 -> 0002 -> 0003 -> 0004.

create extension if not exists pgcrypto; -- for gen_random_uuid()
create extension if not exists pg_trgm;

-- profiles: 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme_preference text default 'dark' check (theme_preference in ('dark','light','system')),
  ai_preferences jsonb default '{}'::jsonb, -- e.g. { "auto_enrich": true }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- collections
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  icon text,
  accent_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- saved_items: the core entity
create table saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- content
  input_type text not null check (input_type in ('url','note','image','file')),
  url text,
  title text,
  description text,
  thumbnail_url text,
  favicon_url text,
  source_domain text,
  content_type text, -- e.g. 'video','article','repo','image','pdf','tutorial','product'
  storage_path text, -- for uploaded images/files in Supabase Storage

  -- the signature context fields
  reason_tag text check (reason_tag in ('inspiration','learn_later','use_in_project','research','content_idea','buy_later','reference','just_interesting')),
  what_was_i_thinking text, -- free-text personal note, USER-AUTHORED ONLY

  -- AI-generated (clearly separate columns, never merged with user fields)
  ai_category text,
  ai_summary text,
  ai_possible_use text,
  ai_processed_at timestamptz,
  ai_status text default 'pending' check (ai_status in ('pending','processing','done','skipped','failed')),

  -- organization
  collection_id uuid references collections(id) on delete set null,
  project_id uuid references projects(id) on delete set null,

  -- state
  is_favorite boolean default false,
  is_archived boolean default false,

  saved_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- tags (user-scoped, reusable)
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- saved_item_tags: many-to-many
create table saved_item_tags (
  saved_item_id uuid not null references saved_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  source text default 'user' check (source in ('user','ai')), -- who added the tag
  primary key (saved_item_id, tag_id)
);

-- tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_complete boolean default false,
  priority text default 'normal' check (priority in ('low','normal','high')),
  due_date date,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- task_references: links a task to one or more saved items
create table task_references (
  task_id uuid not null references tasks(id) on delete cascade,
  saved_item_id uuid not null references saved_items(id) on delete cascade,
  primary key (task_id, saved_item_id)
);

-- project_items: forward-compatible explicit join (v1 UI uses saved_items.project_id directly)
create table project_items (
  project_id uuid not null references projects(id) on delete cascade,
  saved_item_id uuid not null references saved_items(id) on delete cascade,
  primary key (project_id, saved_item_id)
);
