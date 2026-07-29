-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db query --linked -f supabase/migrations/0017_user_text_scale_preference.sql`.
--
-- Persists each user's font-size choice (src/contexts/home-text-scale.tsx)
-- to their account, so it follows them across devices instead of living only
-- in device-local AsyncStorage.
--
-- Deliberately a separate table rather than a column on `public.profiles`:
-- profiles has no "update own row" policy (dropped in
-- 0002_members_and_profiles.sql) because letting a user update their own row
-- would let them repoint `member_id` and grant themselves any permission
-- tier. A dedicated table keeps that lockdown untouched while still letting
-- users freely read/write their own preference row.
--
-- `text_scale_index` mirrors the 5-step TEXT_SCALE_STEPS array in
-- home-text-scale.tsx (indices 0-4), default 2 matches DEFAULT_SCALE_INDEX.

create table public.user_preferences (
  id uuid primary key references auth.users (id) on delete cascade,
  text_scale_index smallint not null default 2 check (text_scale_index between 0 and 4),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user preferences readable by owner"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = id);

create policy "user preferences insertable by owner"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = id);

create policy "user preferences updatable by owner"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
