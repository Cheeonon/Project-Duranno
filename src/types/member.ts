export type Gender = 'male' | 'female';

// 직분 — must match public.church_position in Supabase
export type ChurchPosition =
  | '목사'
  | '사모'
  | '전도사'
  | '간사'
  | '집사'
  | '장로'
  | '권사'
  | '셀장'
  | '회장'
  | '부회장'
  | '새신자 팀장'
  | '성도';

export const CHURCH_POSITION_OPTIONS: ChurchPosition[] = [
  '목사',
  '사모',
  '전도사',
  '간사',
  '집사',
  '장로',
  '권사',
  '셀장',
  '회장',
  '부회장',
  '새신자 팀장',
  '성도',
];

// 권한 — must match public.member_permission in Supabase
export type MemberPermission = '성도' | '셀장' | '사역자' | '재정' | '관리자';

export const MEMBER_PERMISSION_OPTIONS: MemberPermission[] = [
  '성도',
  '셀장',
  '사역자',
  '재정',
  '관리자',
];

/** 부서 — demo: unmarried ages 18–45 → 청년부, otherwise 장년부 */
export type MemberMinistry = '청년부' | '장년부';

export const MEMBER_MINISTRY_OPTIONS: MemberMinistry[] = ['청년부', '장년부'];

export type CellGroupMembership = {
  cellLeaderId: string | null; // null = they led their own cell during this period
  /** Display label, e.g. "김민수 셀" */
  cellGroup: string;
  from: string; // ISO date
  to: string; // ISO date
  /** True when the row was synthesized because DB history was empty. */
  isVirtual?: boolean;
};

export type Member = {
  id: string;
  nameKo: string;
  /** English given name */
  firstNameEn: string;
  /** English family name */
  lastNameEn: string;
  householdHeadId: string | null; // 세대주 — null if this member is the head of their own household
  permission: MemberPermission;
  position: ChurchPosition;
  dob: string; // ISO date
  phone: string;
  cellLeaderId: string | null; // null = this member IS the 셀장 of their own cell
  cellGroup: string; // computed display label, "{리더 이름} 셀" — not stored, derived from cellLeaderId
  previousCellGroups: CellGroupMembership[];
  /** Canadian address — street line (e.g. 123 Finch Ave W) */
  addressStreet: string;
  /** Optional unit / apt */
  addressUnit: string;
  addressCity: string;
  /** Province/territory code, e.g. ON */
  addressProvince: string;
  /** Postal code, e.g. M2N 1A1 */
  addressPostalCode: string;
  gender: Gender;
  isMarried: boolean;
  ministry: MemberMinistry;
  photoPath: string | null; // storage object path, persisted
  photoUrl?: string | null; // ephemeral signed URL, populated only by useMembers()
};
