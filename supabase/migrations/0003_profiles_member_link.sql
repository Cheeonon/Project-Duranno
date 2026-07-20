-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Links login accounts (profiles) to their roster row in members.
-- profiles no longer stores name_ko/position/role directly — that data lives on
-- members and is reached via member_id, so there is exactly one place it can drift.
-- Safe only while `profiles` is empty (add column is `not null` with no default).

alter table public.profiles
  add column member_id uuid not null references public.members (id),
  add constraint profiles_member_id_key unique (member_id);

alter table public.profiles
  drop column name_ko,
  drop column position,
  drop column role;

-- New accounts must specify which member they belong to via user metadata's
-- `member_id`, set when the account is created (Supabase dashboard "Add user",
-- or later an admin Edge Function using the service_role key).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, member_id)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'member_id')::uuid
  );
  return new;
end;
$$;
