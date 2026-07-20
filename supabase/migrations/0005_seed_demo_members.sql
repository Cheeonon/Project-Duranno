-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Seeds the members table with the same 8 people that used to live in
-- src/constants/members-demo.ts, so the app has real DB-backed rows to show.
-- Runs as the SQL editor's role (bypasses RLS), so this works regardless of
-- the policies in 0004_members_rls.sql.

insert into public.members
  (id, name_ko, name_en, dob, gender, phone, address, cell_group, permission, position)
values
  ('a0000000-0000-0000-0000-000000000001', '김민수', 'Kim Min-su', '1982-04-15', 'male',
    '010-2345-6789', '서울시 강남구', '요한 셀', '셀장', '집사'),
  ('a0000000-0000-0000-0000-000000000002', '이은혜', 'Lee Eun-hye', '1978-11-03', 'female',
    '010-3456-7890', '서울시 서초구', '요한 셀', '임원', '권사'),
  ('a0000000-0000-0000-0000-000000000003', '박준호', 'Park Jun-ho', '1995-07-22', 'male',
    '010-4567-8901', '서울시 송파구', '요한 셀', '성도', '셀원'),
  ('a0000000-0000-0000-0000-000000000004', '최서연', 'Choi Seo-yeon', '1998-01-08', 'female',
    '010-5678-9012', '경기도 성남시', '요한 셀', '재정', '셀원'),
  ('a0000000-0000-0000-0000-000000000005', '정우진', 'Jeong Woo-jin', '1992-09-30', 'male',
    '010-6789-0123', '경기도 용인시', '요한 셀', '사역자', '셀원'),
  ('a0000000-0000-0000-0000-000000000006', '한지민', 'Han Ji-min', '1989-12-19', 'female',
    '010-7890-1234', '서울시 마포구', '베드로 셀', '셀장', '셀원'),
  ('a0000000-0000-0000-0000-000000000007', '오성훈', 'Oh Seong-hun', '1975-06-02', 'male',
    '010-8901-2345', '인천시 남동구', '베드로 셀', '재정', '집사'),
  ('a0000000-0000-0000-0000-000000000008', '윤다은', 'Yoon Da-eun', '2001-03-27', 'female',
    '010-9012-3456', '서울시 영등포구', '바울 셀', '성도', '셀원');

insert into public.member_cell_group_history (member_id, cell_group, from_date, to_date)
values
  ('a0000000-0000-0000-0000-000000000002', '마가 셀', '2019-01-01', '2022-12-31'),
  ('a0000000-0000-0000-0000-000000000004', '누가 셀', '2020-03-01', '2023-06-30'),
  ('a0000000-0000-0000-0000-000000000006', '요한 셀', '2021-01-01', '2023-12-31'),
  ('a0000000-0000-0000-0000-000000000008', '베드로 셀', '2022-01-01', '2024-06-30');
