export type Gender = 'male' | 'female';

// 직분 — church-appointed title
export type ChurchPosition = 'brother' | 'sister' | 'deacon' | 'deaconess' | 'elder';

// 역할 — permission/team role
export type MemberRole = 'newcomerTeam' | 'cellLeader' | 'teacher' | 'finance' | 'minister';

export type CellGroupMembership = {
  cellGroup: string;
  from: string; // ISO date
  to: string; // ISO date
};

export type Member = {
  id: string;
  nameKo: string;
  nameEn: string;
  age: number;
  householdHeadId: string | null; // 세대주 — null if this member is the head of their own household
  role: MemberRole;
  position: ChurchPosition;
  dob: string; // ISO date
  phone: string;
  cellGroup: string;
  previousCellGroups: CellGroupMembership[];
  address: string;
  gender: Gender;
};
