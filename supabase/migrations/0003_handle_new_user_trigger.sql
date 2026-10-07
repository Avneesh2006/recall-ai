-- Auto-create a profiles row whenever a new auth.users row is inserted.
-- Uses the display_name passed in signUp()'s options.data, falling back
-- to the email if it's missing.

create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
