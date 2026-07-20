-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Fixes "infinite recursion detected in policy for relation members".
--
-- effective_cell_leader() was `language sql`, which Postgres inlines directly
-- into the calling query. Since RLS policies on `members` call this function
-- and its body queries `members` again, the planner sees the (inlined) policy
-- referencing the same relation whose RLS is being evaluated, and raises a
-- (false-positive, non-runtime) infinite recursion error.
--
-- plpgsql functions are opaque to the planner (never inlined), which breaks
-- the self-referential chain.

create or replace function public.effective_cell_leader(target_member_id uuid)
returns uuid
language plpgsql
stable
security definer set search_path = public
as $$
declare
  result uuid;
begin
  select coalesce(cell_leader_id, id) into result from public.members where id = target_member_id;
  return result;
end;
$$;
