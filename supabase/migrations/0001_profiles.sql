-- SUPERSEDED — do not run. The live schema moved to a separate `members`
-- table with `profiles` as a thin link (see 0002_members_and_profiles.sql).
-- Kept only as a historical record of the original single-table design.
--
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Creates the profiles table used to show the logged-in user's real name/role,
-- replacing the hardcoded DEMO_CURRENT_USER constant.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name_ko text not null,
  position text not null default 'brother'
    check (position in ('brother', 'sister', 'deacon', 'deaconess', 'elder')),
  role text not null default 'newcomerTeam'
    check (role in ('newcomerTeam', 'cellLeader', 'teacher', 'finance', 'minister')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever an auth user is created (via dashboard
-- "Add user" or any future invite flow). SECURITY DEFINER bypasses RLS so no
-- INSERT policy is needed for regular users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name_ko, position, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name_ko', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'position', 'brother'),
    coalesce(new.raw_user_meta_data ->> 'role', 'newcomerTeam')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
