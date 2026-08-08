-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Tracks whether a member's login account is suspended (cannot sign in).
-- Actual login block is enforced via auth.users ban_duration in the
-- set-member-account-suspended edge function; this column drives the UI.

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;
