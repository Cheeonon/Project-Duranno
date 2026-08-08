-- Run this in the Supabase SQL editor if these columns are not already present.
-- Canadian-style structured address fields on members.
-- (Already applied in the live project; kept here for other environments.)

alter table public.members
  add column if not exists address_street text;

alter table public.members
  add column if not exists address_unit text;

alter table public.members
  add column if not exists address_city text;

alter table public.members
  add column if not exists address_province text;

alter table public.members
  add column if not exists address_postal_code text;
