-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Attendance records (출석 기록), one row per (member, Sunday).
-- present: null/false with no reason = 미기록(○), true = 출석(✓), false + absence_reason = 결석(✕).
-- The app pre-creates (upserts) a row for every member × Sunday in the month being
-- viewed, so a full month is always queryable even before anyone marks it.

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  attended_date date not null,
  present boolean,
  absence_reason text,
  created_at timestamptz not null default now(),
  unique (member_id, attended_date)
);

alter table public.attendance_records enable row level security;
