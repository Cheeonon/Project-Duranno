export type Gender = 'male' | 'female';

// 직분 — church-appointed title
export type ChurchPosition =
  | '목사'
  | '사모'
  | '전도사'
  | '간사'
  | '집사'
  | '장로'
  | '권사'
  | '셀장'
  | '새신자 팀원'
  | '셀원'
  | '회장'
  | '부회장'
  | '새신자 팀장';

// 권한 — DB read/write access level
export type MemberPermission = '성도' | '임원' | '셀장' | '사역자' | '재정' | '관리자';

export type CellGroupMembership = {
  cellLeaderId: string | null; // null = they led their own cell during this period
  from: string; // ISO date
  to: string; // ISO date
};

export type Member = {
  id: string;
  nameKo: string;
  nameEn: string;
  householdHeadId: string | null; // 세대주 — null if this member is the head of their own household
  permission: MemberPermission;
  position: ChurchPosition;
  dob: string; // ISO date
  phone: string;
  cellLeaderId: string | null; // null = this member IS the 셀장 of their own cell
  cellGroup: string; // computed display label, "{리더 이름} 셀" — not stored, derived from cellLeaderId
  previousCellGroups: CellGroupMembership[];
  address: string;
  gender: Gender;
};
