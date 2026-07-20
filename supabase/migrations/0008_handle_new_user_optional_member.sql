-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- The dashboard's "Add user" dialog doesn't always expose a metadata field, so
-- the trigger must not crash when raw_user_meta_data has no member_id — it just
-- skips creating a profiles row, and you link it manually afterward (see below).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  linked_member_id uuid;
begin
  linked_member_id := (new.raw_user_meta_data ->> 'member_id')::uuid;

  if linked_member_id is not null then
    insert into public.profiles (id, member_id)
    values (new.id, linked_member_id);
  end if;

  return new;
end;
$$;

-- After creating a user in Authentication → Users (no metadata needed), link it
-- to its members row by hand:
--
-- insert into public.profiles (id, member_id)
-- values ('<new-user-uuid-from-Users-list>', '<member-uuid-from-members-table>');
