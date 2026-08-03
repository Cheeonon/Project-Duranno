-- Run this in the Supabase SQL editor if these columns are not already present.
-- Splits English name into first / last (replaces members.name_en).
-- Live project already has first_name_en / last_name_en.

alter table public.members
  add column if not exists first_name_en text;

alter table public.members
  add column if not exists last_name_en text;

-- Best-effort split of legacy name_en ("First Last") when migrating older DBs.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'members'
      and column_name = 'name_en'
  ) then
    update public.members
    set
      first_name_en = coalesce(
        first_name_en,
        nullif(split_part(trim(name_en), ' ', 1), '')
      ),
      last_name_en = coalesce(
        last_name_en,
        nullif(trim(substring(trim(name_en) from length(split_part(trim(name_en), ' ', 1)) + 2)), '')
      )
    where name_en is not null
      and trim(name_en) <> '';

    alter table public.members drop column name_en;
  end if;
end $$;
