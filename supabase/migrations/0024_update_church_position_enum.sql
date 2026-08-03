-- Run this in the Supabase SQL editor if the live enum is not already updated.
-- Aligns public.church_position with the current roster titles used by the app:
--   목사, 사모, 전도사, 간사, 집사, 장로, 권사, 셀장, 회장, 부회장, 새신자 팀장, 성도
-- Removed from the previous set: 셀원, 새신자 팀원.
--
-- Postgres cannot drop enum values in-place, so this recreates the type.

-- Remap legacy titles before swapping the type.
update public.members
set position = '성도'
where position::text in ('셀원', '새신자 팀원');

alter table public.members
  alter column position type text using position::text;

drop type public.church_position;

create type public.church_position as enum (
  '목사',
  '사모',
  '전도사',
  '간사',
  '집사',
  '장로',
  '권사',
  '셀장',
  '회장',
  '부회장',
  '새신자 팀장',
  '성도'
);

alter table public.members
  alter column position type public.church_position
  using position::public.church_position;
