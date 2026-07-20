-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- RLS for attendance_records — same scope as members (0004_members_rls.sql):
-- Read:  임원, 사역자, 재정 see everyone; 셀장 sees only their own cell_group.
-- Write: 임원 can write anyone; 셀장 can write only their own cell_group.
--        사역자/재정 are read-only.

create policy "attendance readable by 임원, 사역자, 재정"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정')
    )
  );

create policy "attendance readable by own 셀장"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = attendance_records.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  );

create policy "attendance writable by 임원"
  on public.attendance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '임원'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '임원'
    )
  );

create policy "attendance writable by own 셀장"
  on public.attendance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = attendance_records.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = attendance_records.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  );
