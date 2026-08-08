-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Adds 인도자 (introducer): another member who brought this person to church.

alter table public.members
  add column if not exists introducer_id uuid references public.members (id);

create index if not exists members_introducer_id_idx
  on public.members (introducer_id);

-- CREATE OR REPLACE VIEW cannot reorder/rename columns when m.* gains a new
-- field, so drop and recreate the browse-friendly view.
drop view if exists public.members_readable;

create view public.members_readable
  with (security_invoker = true) as
select
  m.*,
  hh.name_ko as household_head_name,
  cl.name_ko as cell_leader_name,
  intro.name_ko as introducer_name
from public.members m
left join public.members hh on hh.id = m.household_head_id
left join public.members cl on cl.id = m.cell_leader_id
left join public.members intro on intro.id = m.introducer_id;
