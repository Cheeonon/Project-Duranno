-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db query --linked -f supabase/migrations/0018_calendar_events.sql`.
--
-- Replaces the hardcoded demo data in src/constants/calendar-demo.ts with a
-- real, persisted, RLS-gated events table. `recurs_annually` lets an event
-- (typically a birthday, or a fixed-date holiday like 추수감사절) reappear
-- every year from its stored month/day without being re-entered — the app
-- resolves the actual occurrence date client-side (see src/lib/calendar-events.ts).
--
-- Following 0011_permission_position_enums.sql's precedent of real Postgres
-- enums (Supabase Studio renders them as a dropdown) rather than text+check.

create type public.calendar_event_category as enum ('birthdays', 'events');

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  category public.calendar_event_category not null,
  event_date date not null, -- anchor date; for recurring events only month/day matter going forward
  recurs_annually boolean not null default false,
  -- Composite field-access, not a subquery — Postgres DEFAULT expressions
  -- can't contain subqueries (unlike RLS USING/WITH CHECK clauses, where the
  -- `(select id from public.current_member())` form is used elsewhere).
  created_by uuid references public.members (id) default (public.current_member()).id,
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

-- Calendar visibility is church-wide — unlike members/attendance, every
-- logged-in account can read events regardless of permission tier.
create policy "calendar_events readable by all authenticated"
  on public.calendar_events for select
  to authenticated
  using (true);

create policy "calendar_events writable by 임원, 관리자, 사역자 (insert)"
  on public.calendar_events for insert
  to authenticated
  with check ((select permission from public.current_member()) in ('임원', '관리자', '사역자'));

create policy "calendar_events writable by 임원, 관리자, 사역자 (update)"
  on public.calendar_events for update
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자', '사역자'))
  with check ((select permission from public.current_member()) in ('임원', '관리자', '사역자'));

create policy "calendar_events writable by 임원, 관리자, 사역자 (delete)"
  on public.calendar_events for delete
  to authenticated
  using ((select permission from public.current_member()) in ('임원', '관리자', '사역자'));

-- Seed: adapted from the old calendar-demo.ts fixtures, given real dates.
insert into public.calendar_events (title, detail, category, event_date, recurs_annually) values
  ('김민수 집사 생일', '1층 로비에서 축하 카드 전달', 'birthdays', '2026-08-04', true),
  ('전교인 기도회', '오후 7:30 · 본당', 'events', '2026-08-07', false),
  ('이은혜 권사 생일', '성가대원 · 축하 기도 요청', 'birthdays', '2026-08-15', true),
  ('청년부 야외예배', '오전 10:00 · 교회 앞마당', 'events', '2026-08-23', false),
  ('박준호 형제 생일', '청년부 · 식사 축하 예정', 'birthdays', '2026-09-02', true),
  ('교육부 수련회', '오전 9:00 · 교육관 2층', 'events', '2026-09-12', false),
  ('추수감사절 특별예배', '오전 11:00 · 본당', 'events', '2026-11-22', true);
