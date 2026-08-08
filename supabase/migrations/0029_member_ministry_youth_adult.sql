-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Adds marital status + ministry (청년부 / 장년부) for members.
-- Demo rule: unmarried and age 18–45 → 청년부; otherwise → 장년부.

alter table public.members
  add column if not exists is_married boolean not null default false;

alter table public.members
  add column if not exists ministry text not null default '장년부';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'members_ministry_check'
  ) then
    alter table public.members
      add constraint members_ministry_check
      check (ministry in ('청년부', '장년부'));
  end if;
end $$;

-- Demo marital status for the seeded roster (safe if ids are missing).
update public.members
set is_married = true
where id in (
  'a0000000-0000-0000-0000-000000000001', -- 김민수
  'a0000000-0000-0000-0000-000000000002', -- 이은혜
  'a0000000-0000-0000-0000-000000000006', -- 한지민
  'a0000000-0000-0000-0000-000000000007'  -- 오성훈
);

update public.members
set is_married = false
where id in (
  'a0000000-0000-0000-0000-000000000003', -- 박준호
  'a0000000-0000-0000-0000-000000000004', -- 최서연
  'a0000000-0000-0000-0000-000000000005', -- 정우진
  'a0000000-0000-0000-0000-000000000008'  -- 윤다은
);

update public.members
set ministry = case
  when not is_married
    and extract(year from age(current_date, dob))::int between 18 and 45
  then '청년부'
  else '장년부'
end;
