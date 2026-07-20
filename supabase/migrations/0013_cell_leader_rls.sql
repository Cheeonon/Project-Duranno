-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Recreates every RLS policy on members / member_cell_group_history /
-- attendance_records — all of them were dropped in 0011 (enum conversion
-- couldn't proceed otherwise). The 임원/사역자/재정/관리자 policies are
-- unchanged from before; the 셀장 ones now use effective_cell_leader(...)
-- instead of the dropped cell_group text column.

-- members
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

create policy "members readable by own 셀장"
  on public.members for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid()
        and m.permission = '셀장'
        and public.effective_cell_leader(members.id) = m.id
    )
  );

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

create policy "members writable by own 셀장 (insert)"
  on public.members for insert
  to authenticated
  with check (
    cell_leader_id = (
      select m.id from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장'
    )
  );

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

create policy "members writable by own 셀장 (update)"
  on public.members for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid()
        and m.permission = '셀장'
        and public.effective_cell_leader(members.id) = m.id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid()
        and m.permission = '셀장'
        and public.effective_cell_leader(members.id) = m.id
    )
  );

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

create policy "members writable by own 셀장 (delete)"
  on public.members for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid()
        and m.permission = '셀장'
        and public.effective_cell_leader(members.id) = m.id
    )
  );

-- member_cell_group_history
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

create policy "history readable by own 셀장"
  on public.member_cell_group_history for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(member_cell_group_history.member_id) = leader.id
    )
  );

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

create policy "history writable by own 셀장"
  on public.member_cell_group_history for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(member_cell_group_history.member_id) = leader.id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(member_cell_group_history.member_id) = leader.id
    )
  );

-- attendance_records
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

create policy "attendance readable by own 셀장"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(attendance_records.member_id) = leader.id
    )
  );

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

create policy "attendance writable by own 셀장"
  on public.attendance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(attendance_records.member_id) = leader.id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      where p.id = auth.uid()
        and leader.permission = '셀장'
        and public.effective_cell_leader(attendance_records.member_id) = leader.id
    )
  );
