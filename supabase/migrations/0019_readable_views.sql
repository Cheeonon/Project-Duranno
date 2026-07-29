-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db query --linked -f supabase/migrations/0019_readable_views.sql`.
--
-- Every table that references a person only stores their `members.id` (or,
-- for user_preferences, an `auth.users.id`) — convenient for the app, but
-- painful to browse directly in the Table Editor / SQL editor since all you
-- see is a bare UUID. These read-only views add the person's name alongside
-- every such id, without changing any base table, RLS policy, or app query.
--
-- `security_invoker = true` (Postgres 15+, supported by Supabase) makes each
-- view run with the *querying user's* privileges/RLS, not the view owner's —
-- critical here, since without it a view could silently bypass the RLS this
-- app relies on everywhere (e.g. a 셀장 seeing other cells' member names).
--
-- `create or replace view` throughout so this file is safe to re-run.

create or replace view public.members_readable
  with (security_invoker = true) as
select
  m.*,
  hh.name_ko as household_head_name,
  cl.name_ko as cell_leader_name
from public.members m
left join public.members hh on hh.id = m.household_head_id
left join public.members cl on cl.id = m.cell_leader_id;

create or replace view public.profiles_readable
  with (security_invoker = true) as
select
  p.*,
  m.name_ko as member_name
from public.profiles p
left join public.members m on m.id = p.member_id;

create or replace view public.member_cell_group_history_readable
  with (security_invoker = true) as
select
  h.*,
  m.name_ko as member_name,
  cl.name_ko as cell_leader_name
from public.member_cell_group_history h
left join public.members m on m.id = h.member_id
left join public.members cl on cl.id = h.cell_leader_id;

create or replace view public.attendance_records_readable
  with (security_invoker = true) as
select
  a.*,
  m.name_ko as member_name
from public.attendance_records a
left join public.members m on m.id = a.member_id;

create or replace view public.calendar_events_readable
  with (security_invoker = true) as
select
  e.*,
  m.name_ko as created_by_name
from public.calendar_events e
left join public.members m on m.id = e.created_by;

create or replace view public.user_preferences_readable
  with (security_invoker = true) as
select
  up.*,
  m.name_ko as member_name
from public.user_preferences up
left join public.profiles p on p.id = up.id
left join public.members m on m.id = p.member_id;
