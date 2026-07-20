-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Replaces the free-text cell_group column with a relational link to the
-- member who leads that cell — cell group names are just "{리더 이름} 셀", so
-- storing a hand-typed string invites drift/typos. null = this member IS the
-- 셀장 of their own cell (same convention as household_head_id).

alter table public.members add column cell_leader_id uuid references public.members (id);

-- Backfill from the outgoing cell_group text: point every non-leader at the
-- 셀장 who currently shares that same cell_group string.
update public.members target
set cell_leader_id = leader.id
from public.members leader
where leader.permission = '셀장'
  and leader.cell_group = target.cell_group
  and target.id <> leader.id;

alter table public.members drop column cell_group;

-- member_cell_group_history gets the same treatment for prior cell membership.
alter table public.member_cell_group_history add column cell_leader_id uuid references public.members (id);
alter table public.member_cell_group_history drop column cell_group;

-- RLS helper: "which cell does this member effectively belong to" — a leader's
-- own id, or the id of whoever they point at.
create or replace function public.effective_cell_leader(target_member_id uuid)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select coalesce(cell_leader_id, id) from public.members where id = target_member_id;
$$;
