-- RLS: every user-owned table restricted to auth.uid(). This is the
-- primary security boundary for the whole app (Section 19).

-- profiles ------------------------------------------------------------
alter table profiles enable row level security;

create policy "select own profile" on profiles
  for select using (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id);
-- No user-facing insert policy: rows are created by the
-- handle_new_user() trigger (security definer) on signup.
-- No delete policy: profile rows are removed via the auth.users
-- cascade when an account is deleted (Section 27), an admin operation.

-- collections -----------------------------------------------------------
alter table collections enable row level security;

create policy "select own collections" on collections
  for select using (auth.uid() = user_id);
create policy "insert own collections" on collections
  for insert with check (auth.uid() = user_id);
create policy "update own collections" on collections
  for update using (auth.uid() = user_id);
create policy "delete own collections" on collections
  for delete using (auth.uid() = user_id);

-- projects --------------------------------------------------------------
alter table projects enable row level security;

create policy "select own projects" on projects
  for select using (auth.uid() = user_id);
create policy "insert own projects" on projects
  for insert with check (auth.uid() = user_id);
create policy "update own projects" on projects
  for update using (auth.uid() = user_id);
create policy "delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- saved_items -------------------------------------------------------------
alter table saved_items enable row level security;

create policy "select own saved_items" on saved_items
  for select using (auth.uid() = user_id);
create policy "insert own saved_items" on saved_items
  for insert with check (auth.uid() = user_id);
create policy "update own saved_items" on saved_items
  for update using (auth.uid() = user_id);
create policy "delete own saved_items" on saved_items
  for delete using (auth.uid() = user_id);

-- tags --------------------------------------------------------------------
alter table tags enable row level security;

create policy "select own tags" on tags
  for select using (auth.uid() = user_id);
create policy "insert own tags" on tags
  for insert with check (auth.uid() = user_id);
create policy "update own tags" on tags
  for update using (auth.uid() = user_id);
create policy "delete own tags" on tags
  for delete using (auth.uid() = user_id);

-- tasks ---------------------------------------------------------------------
alter table tasks enable row level security;

create policy "select own tasks" on tasks
  for select using (auth.uid() = user_id);
create policy "insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);
create policy "update own tasks" on tasks
  for update using (auth.uid() = user_id);
create policy "delete own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- saved_item_tags (join table, no direct user_id — check via parent) --------
alter table saved_item_tags enable row level security;

create policy "manage own saved_item_tags" on saved_item_tags
  for all using (
    exists (select 1 from saved_items s where s.id = saved_item_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from saved_items s where s.id = saved_item_id and s.user_id = auth.uid())
  );

-- task_references (join table) ----------------------------------------------
alter table task_references enable row level security;

create policy "manage own task_references" on task_references
  for all using (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  )
  with check (
    exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- project_items (join table) -------------------------------------------------
alter table project_items enable row level security;

create policy "manage own project_items" on project_items
  for all using (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );
