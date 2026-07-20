-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- RLS policies for members / member_cell_group_history.
-- Read:  임원, 사역자, 재정 see everyone; 셀장 sees only their own cell_group.
-- Write: 임원 can write anyone; 셀장 can write only their own cell_group.
--        사역자/재정 are read-only.

-- members: read
create policy "members readable by 임원, 사역자, 재정"
  on public.members for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정')
    )
  );

create policy "members readable by own 셀장"
  on public.members for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장' and m.cell_group = members.cell_group
    )
  );

-- members: write (임원, any row)
create policy "members writable by 임원 (insert)"
  on public.members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '임원'
    )
  );

create policy "members writable by 임원 (update)"
  on public.members for update
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

create policy "members writable by 임원 (delete)"
  on public.members for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '임원'
    )
  );

-- members: write (셀장, own cell_group only)
create policy "members writable by own 셀장 (insert)"
  on public.members for insert
  to authenticated
  with check (
    cell_group = (
      select m.cell_group from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장'
    )
  );

create policy "members writable by own 셀장 (update)"
  on public.members for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장' and m.cell_group = members.cell_group
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장' and m.cell_group = members.cell_group
    )
  );

create policy "members writable by own 셀장 (delete)"
  on public.members for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission = '셀장' and m.cell_group = members.cell_group
    )
  );

-- member_cell_group_history: same read/write scope as members, reached via member_id
create policy "history readable by 임원, 사역자, 재정"
  on public.member_cell_group_history for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members m on m.id = p.member_id
      where p.id = auth.uid() and m.permission in ('임원', '사역자', '재정')
    )
  );

create policy "history readable by own 셀장"
  on public.member_cell_group_history for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = member_cell_group_history.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  );

create policy "history writable by 임원"
  on public.member_cell_group_history for all
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

create policy "history writable by own 셀장"
  on public.member_cell_group_history for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = member_cell_group_history.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.members leader on leader.id = p.member_id
      join public.members target on target.id = member_cell_group_history.member_id
      where p.id = auth.uid() and leader.permission = '셀장' and leader.cell_group = target.cell_group
    )
  );
