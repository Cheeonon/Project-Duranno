-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db query --linked -f supabase/migrations/0016_member_photos.sql`.
--
-- Adds a profile photo per member, stored in a *private* Storage bucket so
-- photos get the same RLS-gated access as the rest of the members data
-- (never a public bucket/URL). `members.photo_path` stores only the storage
-- object path — never a URL, since access is via short-lived signed URLs
-- generated on demand by the client.
--
-- Object path convention: `<member_id>/<timestamp>.<ext>`. The leading
-- folder segment is the member's id, which every policy below extracts via
-- `(storage.foldername(name))[1]::uuid` so the same permission tiers as
-- `public.members` (see 0015_fix_members_rls_recursion.sql) apply here too,
-- reusing the same SECURITY DEFINER helpers (`current_member()`,
-- `effective_cell_leader()`) to avoid the RLS recursion issues 0014/0015
-- already had to work around.

alter table public.members add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- select

create policy "member photos readable by 임원, 사역자, 재정, 관리자"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) in ('임원', '사역자', '재정', '관리자')
  );

create policy "member photos readable by own 셀장"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(((storage.foldername(name))[1])::uuid) = (select id from public.current_member())
  );

-- insert

create policy "member photos writable by 임원, 관리자 (insert)"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) in ('임원', '관리자')
  );

create policy "member photos writable by own 셀장 (insert)"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(((storage.foldername(name))[1])::uuid) = (select id from public.current_member())
  );

-- update

create policy "member photos writable by 임원, 관리자 (update)"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) in ('임원', '관리자')
  )
  with check (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) in ('임원', '관리자')
  );

create policy "member photos writable by own 셀장 (update)"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(((storage.foldername(name))[1])::uuid) = (select id from public.current_member())
  )
  with check (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(((storage.foldername(name))[1])::uuid) = (select id from public.current_member())
  );

-- delete

create policy "member photos writable by 임원, 관리자 (delete)"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) in ('임원', '관리자')
  );

create policy "member photos writable by own 셀장 (delete)"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (select permission from public.current_member()) = '셀장'
    and public.effective_cell_leader(((storage.foldername(name))[1])::uuid) = (select id from public.current_member())
  );
