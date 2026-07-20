-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db query --linked -f supabase/migrations/0015_fix_members_rls_recursion.sql`.
--
-- Fixes "infinite recursion detected in policy for relation members" for real
-- this time. 0014 fixed effective_cell_leader() (SQL-language inlining), but
-- every policy below *also* checks the caller's own permission with a raw
-- inline subquery:
--
--   exists (select 1 from profiles p join members m on m.id = p.member_id
--           where p.id = auth.uid() and m.permission = ...)
--
-- That subquery reads `members` from inside a policy defined on `members`,
-- so evaluating the policy requires re-evaluating the same policy set for
-- the inner row — genuine, unbounded self-reference. Verified directly
-- against the linked DB: the recursion reproduces even with
-- effective_cell_leader() removed from the picture entirely.
--
-- Fix: a SECURITY DEFINER function runs as its owner, which bypasses RLS on
-- its own internal reads — so looking up "my own members row" through one
-- breaks the cycle, same technique 0014 already used for effective_cell_leader.

create or replace function public.current_member()
returns members
language plpgsql
stable
security definer set search_path = public
as $$
declare
  result members;
begin
  select m.* into result
  from public.profiles p
  join public.members m on m.id = p.member_id
  where p.id = auth.uid();
  return result;
end;
$$;

-- members
drop policy "members readable by 임원, 사역자, 재정, 관리자" on public.members;
create policy "members readable by 임원, 사역자, 재정, 관리자"
  on public.members for select
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '사역자', '재정', '관리자'));

drop policy "members readable by own 셀장" on public.members;
create policy "members readable by own 셀장"
  on public.members for select
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(members.id) = (select id from public.current_member())
  );

drop policy "members writable by 임원, 관리자 (insert)" on public.members;
create policy "members writable by 임원, 관리자 (insert)"
  on public.members for insert
  to authenticated
  with check ((select permission from public.current_member()) in ('임원', '관리자'));

drop policy "members writable by own 셀장 (insert)" on public.members;
create policy "members writable by own 셀장 (insert)"
  on public.members for insert
  to authenticated
  with check (
    (select permission from public.current_member()) = '셀장'
    and cell_leader_id = (select id from public.current_member())
  );

drop policy "members writable by 임원, 관리자 (update)" on public.members;
create policy "members writable by 임원, 관리자 (update)"
  on public.members for update
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자'))
  with check ((select permission from public.current_member()) in ('임원', '관리자'));

drop policy "members writable by own 셀장 (update)" on public.members;
create policy "members writable by own 셀장 (update)"
  on public.members for update
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(members.id) = (select id from public.current_member())
  )
  with check (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(members.id) = (select id from public.current_member())
  );

drop policy "members writable by 임원, 관리자 (delete)" on public.members;
create policy "members writable by 임원, 관리자 (delete)"
  on public.members for delete
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자'));

drop policy "members writable by own 셀장 (delete)" on public.members;
create policy "members writable by own 셀장 (delete)"
  on public.members for delete
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(members.id) = (select id from public.current_member())
  );

-- member_cell_group_history
drop policy "history readable by 임원, 사역자, 재정, 관리자" on public.member_cell_group_history;
create policy "history readable by 임원, 사역자, 재정, 관리자"
  on public.member_cell_group_history for select
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '사역자', '재정', '관리자'));

drop policy "history readable by own 셀장" on public.member_cell_group_history;
create policy "history readable by own 셀장"
  on public.member_cell_group_history for select
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(member_cell_group_history.member_id) = (select id from public.current_member())
  );

drop policy "history writable by 임원, 관리자" on public.member_cell_group_history;
create policy "history writable by 임원, 관리자"
  on public.member_cell_group_history for all
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자'))
  with check ((select permission from public.current_member()) in ('임원', '관리자'));

drop policy "history writable by own 셀장" on public.member_cell_group_history;
create policy "history writable by own 셀장"
  on public.member_cell_group_history for all
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(member_cell_group_history.member_id) = (select id from public.current_member())
  )
  with check (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(member_cell_group_history.member_id) = (select id from public.current_member())
  );

-- attendance_records
drop policy "attendance readable by 임원, 사역자, 재정, 관리자" on public.attendance_records;
create policy "attendance readable by 임원, 사역자, 재정, 관리자"
  on public.attendance_records for select
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '사역자', '재정', '관리자'));

drop policy "attendance readable by own 셀장" on public.attendance_records;
create policy "attendance readable by own 셀장"
  on public.attendance_records for select
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(attendance_records.member_id) = (select id from public.current_member())
  );

drop policy "attendance writable by 임원, 관리자" on public.attendance_records;
create policy "attendance writable by 임원, 관리자"
  on public.attendance_records for all
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자'))
  with check ((select permission from public.current_member()) in ('임원', '관리자'));

drop policy "attendance writable by own 셀장" on public.attendance_records;
create policy "attendance writable by own 셀장"
  on public.attendance_records for all
  to authenticated
  using (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(attendance_records.member_id) = (select id from public.current_member())
  )
  with check (
    (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(attendance_records.member_id) = (select id from public.current_member())
  );
