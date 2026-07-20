-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- `members` already exists in the live database (created outside these
-- migration files) and matches src/types/member.ts — this migration does
-- NOT touch it, or attendance_records / member_cell_group_history, or any
-- of their policies. It only fixes `profiles`:
--
-- 1. Drops the stale "users can update their own profile" policy. Profiles
--    now only holds `member_id`, and letting a user update their own row
--    would let them repoint member_id at any member — including a 임원/
--    사역자/재정 member — silently granting themselves that permission
--    everywhere else, since every other policy trusts profiles.member_id.
-- 2. Replaces handle_new_user() so newly created auth accounts get a
--    profiles row shaped (id, member_id) instead of the old pre-members
--    shape (name_ko, position, role) that no longer matches the table.
-- 3. Drops the NOT NULL constraint on member_id — it must be nullable
--    since an admin fills it in only after the account already exists
--    (Supabase's "Add user" dialog has no metadata field to set it at
--    creation time). Without this, every new signup fails outright.

alter table public.profiles enable row level security;
alter table public.profiles alter column member_id drop not null;

drop policy if exists "users can update their own profile" on public.profiles;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, member_id)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'member_id', '')::uuid
  );
  return new;
end;
$$;
