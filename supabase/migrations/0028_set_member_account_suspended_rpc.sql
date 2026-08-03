-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Lets 관리자 toggle profiles.is_suspended without an Edge Function.
-- Login block is enforced in the app after sign-in (auth-context).

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

create or replace function public.set_member_account_suspended(
  p_member_id uuid,
  p_suspended boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_permission public.member_permission;
  target_profile_id uuid;
begin
  select permission into caller_permission from public.current_member();

  if caller_permission is distinct from '관리자' then
    raise exception '관리자만 활동정지를 설정할 수 있습니다.';
  end if;

  select id into target_profile_id
  from public.profiles
  where member_id = p_member_id;

  if target_profile_id is null then
    raise exception '해당 성도의 계정을 찾을 수 없습니다.';
  end if;

  if target_profile_id = auth.uid() and p_suspended then
    raise exception '본인 계정은 활동정지할 수 없습니다.';
  end if;

  update public.profiles
  set is_suspended = p_suspended
  where id = target_profile_id;
end;
$$;

revoke all on function public.set_member_account_suspended(uuid, boolean) from public;
grant execute on function public.set_member_account_suspended(uuid, boolean) to authenticated;
