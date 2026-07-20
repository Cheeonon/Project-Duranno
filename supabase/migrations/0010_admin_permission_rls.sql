-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Extends the existing 임원 read/write policies (0004, 0007) to also cover 관리자.
-- Drops and recreates each affected policy — Postgres has no ALTER POLICY ... USING.

-- members
drop policy "members readable by 임원, 사역자, 재정" on public.members;
create policy "members readable by 임원, 사역자, 재정, 관리자"
  on public.members for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정', '관리자')
    )
  );

drop policy "members writable by 임원 (insert)" on public.members;
create policy "members writable by 임원, 관리자 (insert)"
  on public.members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  );

drop policy "members writable by 임원 (update)" on public.members;
create policy "members writable by 임원, 관리자 (update)"
  on public.members for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  );

drop policy "members writable by 임원 (delete)" on public.members;
create policy "members writable by 임원, 관리자 (delete)"
  on public.members for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  );

-- member_cell_group_history
drop policy "history readable by 임원, 사역자, 재정" on public.member_cell_group_history;
create policy "history readable by 임원, 사역자, 재정, 관리자"
  on public.member_cell_group_history for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정', '관리자')
    )
  );

drop policy "history writable by 임원" on public.member_cell_group_history;
create policy "history writable by 임원, 관리자"
  on public.member_cell_group_history for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  );

-- attendance_records
drop policy "attendance readable by 임원, 사역자, 재정" on public.attendance_records;
create policy "attendance readable by 임원, 사역자, 재정, 관리자"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정', '관리자')
    )
  );

drop policy "attendance writable by 임원" on public.attendance_records;
create policy "attendance writable by 임원, 관리자"
  on public.attendance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '관리자')
    )
  );
