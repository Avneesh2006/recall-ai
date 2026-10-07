-- Storage bucket for image/file saves (Flow B, Section 6).
-- Objects are stored under "<user_id>/<uuid>-<filename>" so a user's own
-- folder is the RLS boundary. The bucket is public-read (so thumbnails
-- can be rendered directly by URL without signed-URL plumbing) but
-- writes/deletes are restricted to the owning user below — the path
-- prefix, not bucket privacy, is what actually protects anything here,
-- and nothing sensitive should be inferable from an unguessable
-- UUID-prefixed filename.

insert into storage.buckets (id, name, public)
values ('recall-uploads', 'recall-uploads', true)
on conflict (id) do nothing;

create policy "select own or public uploads"
  on storage.objects for select
  using (bucket_id = 'recall-uploads');

create policy "insert own uploads"
  on storage.objects for insert
  with check (
    bucket_id = 'recall-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "update own uploads"
  on storage.objects for update
  using (
    bucket_id = 'recall-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own uploads"
  on storage.objects for delete
  using (
    bucket_id = 'recall-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
