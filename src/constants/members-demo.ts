import type { ChurchPosition, Member } from '@/types/member';

export const POSITION_LABELS: Record<ChurchPosition, string> = {
  brother: '형제',
  sister: '자매',
  deacon: '집사',
  deaconess: '권사',
  elder: '장로',
};

export const DEMO_CHURCH_MEMBERS: Member[] = [
  {
    id: 'member-1',
    nameKo: '김민수',
    nameEn: 'Kim Min-su',
    age: 44,
    householdHeadId: null,
    role: 'cellLeader',
    position: 'deacon',
    dob: '1982-04-15',
    phone: '010-2345-6789',
    cellGroup: '요한 셀',
    previousCellGroups: [],
    address: '서울시 강남구',
    gender: 'male',
  },
  {
    id: 'member-2',
    nameKo: '이은혜',
    nameEn: 'Lee Eun-hye',
    age: 47,
    householdHeadId: null,
    role: 'teacher',
    position: 'deaconess',
    dob: '1978-11-03',
    phone: '010-3456-7890',
    cellGroup: '요한 셀',
    previousCellGroups: [{ cellGroup: '마가 셀', from: '2019-01-01', to: '2022-12-31' }],
    address: '서울시 서초구',
    gender: 'female',
  },
  {
    id: 'member-3',
    nameKo: '박준호',
    nameEn: 'Park Jun-ho',
    age: 30,
    householdHeadId: null,
    role: 'newcomerTeam',
    position: 'brother',
    dob: '1995-07-22',
    phone: '010-4567-8901',
    cellGroup: '요한 셀',
    previousCellGroups: [],
    address: '서울시 송파구',
    gender: 'male',
  },
  {
    id: 'member-4',
    nameKo: '최서연',
    nameEn: 'Choi Seo-yeon',
    age: 28,
    householdHeadId: null,
    role: 'finance',
    position: 'sister',
    dob: '1998-01-08',
    phone: '010-5678-9012',
    cellGroup: '요한 셀',
    previousCellGroups: [{ cellGroup: '누가 셀', from: '2020-03-01', to: '2023-06-30' }],
    address: '경기도 성남시',
    gender: 'female',
  },
  {
    id: 'member-5',
    nameKo: '정우진',
    nameEn: 'Jeong Woo-jin',
    age: 33,
    householdHeadId: null,
    role: 'minister',
    position: 'brother',
    dob: '1992-09-30',
    phone: '010-6789-0123',
    cellGroup: '요한 셀',
    previousCellGroups: [],
    address: '경기도 용인시',
    gender: 'male',
  },
  {
    id: 'member-6',
    nameKo: '한지민',
    nameEn: 'Han Ji-min',
    age: 36,
    householdHeadId: null,
    role: 'cellLeader',
    position: 'sister',
    dob: '1989-12-19',
    phone: '010-7890-1234',
    cellGroup: '베드로 셀',
    previousCellGroups: [{ cellGroup: '요한 셀', from: '2021-01-01', to: '2023-12-31' }],
    address: '서울시 마포구',
    gender: 'female',
  },
  {
    id: 'member-7',
    nameKo: '오성훈',
    nameEn: 'Oh Seong-hun',
    age: 51,
    householdHeadId: null,
    role: 'finance',
    position: 'deacon',
    dob: '1975-06-02',
    phone: '010-8901-2345',
    cellGroup: '베드로 셀',
    previousCellGroups: [],
    address: '인천시 남동구',
    gender: 'male',
  },
  {
    id: 'member-8',
    nameKo: '윤다은',
    nameEn: 'Yoon Da-eun',
    age: 25,
    householdHeadId: null,
    role: 'newcomerTeam',
    position: 'sister',
    dob: '2001-03-27',
    phone: '010-9012-3456',
    cellGroup: '바울 셀',
    previousCellGroups: [{ cellGroup: '베드로 셀', from: '2022-01-01', to: '2024-06-30' }],
    address: '서울시 영등포구',
    gender: 'female',
  },
];

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s.-]/g, '');
}

export function formatMemberDob(dob: string) {
  const [year, month, day] = dob.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export function searchChurchMembers(query: string, members: Member[] = DEMO_CHURCH_MEMBERS) {
  const normalizedQuery = normalizeSearchValue(query.trim());
  if (!normalizedQuery) {
    return members;
  }

  return members.filter((member) => {
    const fields = [
      member.nameKo,
      member.nameEn,
      member.dob,
      member.phone,
      member.cellGroup,
      member.address,
    ].map(normalizeSearchValue);

    return fields.some((field) => field.includes(normalizedQuery));
  });
}
