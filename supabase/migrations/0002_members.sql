-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Members roster (성도) — general congregation data, independent of login accounts.
-- Most members never get an app account; only those who become 임원/셀장/사역자/재정
-- get one later, linked via profiles.member_id (see 0003_profiles_member_link.sql).
-- RLS policies are added separately in 0004_members_rls.sql, once profiles.member_id exists.

create table public.members (
  id uuid primary key default gen_random_uuid(),
  name_ko text not null,
  name_en text,
  dob date not null,
  gender text not null check (gender in ('male', 'female')),
  phone text,
  address text,
  cell_group text not null,
  household_head_id uuid references public.members (id), -- 세대주, null if this member is their own household head
  permission text not null default '성도'
    check (permission in ('성도', '임원', '셀장', '사역자', '재정')),
  position text not null
    check (position in (
      '목사', '사모', '전도사', '간사', '집사', '장로', '권사',
      '셀장', '새신자 팀원', '셀원', '회장', '부회장', '새신자 팀장'
    )),
  created_at timestamptz not null default now()
);

create table public.member_cell_group_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  cell_group text not null,
  from_date date not null,
  to_date date not null
);

alter table public.members enable row level security;
alter table public.member_cell_group_history enable row level security;
