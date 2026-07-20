-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Adds an email column (needed to create login accounts) and a new '관리자'
-- permission tier: same full read/write access as 임원, plus the exclusive
-- ability to issue accounts (enforced in the create-member-account Edge Function,
-- not here — RLS only governs table access).

alter table public.members add column email text;

alter table public.members drop constraint members_permission_check;
alter table public.members add constraint members_permission_check
  check (permission in ('성도', '임원', '셀장', '사역자', '재정', '관리자'));
