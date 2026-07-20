-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Converts permission/position from text+check to real Postgres enum types,
-- so Supabase Studio's Table Editor renders them as a dropdown instead of a
-- free-text field.
--
-- Every existing RLS policy on these 3 tables reads `permission` in its
-- USING/WITH CHECK clause, which blocks an ALTER COLUMN TYPE outright — so
-- they all have to be dropped first. 0013_cell_leader_rls.sql recreates the
-- full final set (this migration does not restore them).

drop policy "attendance readable by own 셀장" on public.attendance_records;
drop policy "attendance readable by 임원, 사역자, 재정, 관리자" on public.attendance_records;
drop policy "attendance writable by own 셀장" on public.attendance_records;
drop policy "attendance writable by 임원, 관리자" on public.attendance_records;

drop policy "history readable by own 셀장" on public.member_cell_group_history;
drop policy "history readable by 임원, 사역자, 재정, 관리자" on public.member_cell_group_history;
drop policy "history writable by own 셀장" on public.member_cell_group_history;
drop policy "history writable by 임원, 관리자" on public.member_cell_group_history;

drop policy "members readable by own 셀장" on public.members;
drop policy "members readable by 임원, 사역자, 재정, 관리자" on public.members;
drop policy "members writable by own 셀장 (delete)" on public.members;
drop policy "members writable by own 셀장 (insert)" on public.members;
drop policy "members writable by own 셀장 (update)" on public.members;
drop policy "members writable by 임원, 관리자 (delete)" on public.members;
drop policy "members writable by 임원, 관리자 (insert)" on public.members;
drop policy "members writable by 임원, 관리자 (update)" on public.members;

create type public.member_permission as enum ('성도', '임원', '셀장', '사역자', '재정', '관리자');

create type public.church_position as enum (
  '목사', '사모', '전도사', '간사', '집사', '장로', '권사',
  '셀장', '새신자 팀원', '셀원', '회장', '부회장', '새신자 팀장'
);

alter table public.members drop constraint members_permission_check;
alter table public.members drop constraint members_position_check;

alter table public.members
  alter column permission drop default,
  alter column permission type public.member_permission using permission::public.member_permission,
  alter column permission set default '성도'::public.member_permission;

alter table public.members
  alter column position type public.church_position using position::public.church_position;
