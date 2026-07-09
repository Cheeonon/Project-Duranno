export type ChurchMember = {
  id: string;
  name: string;
  role: string;
  dob: string;
  phone: string;
  cellGroup: string;
  address: string;
};

export const DEMO_CHURCH_MEMBERS: ChurchMember[] = [
  {
    id: 'member-1',
    name: '김민수',
    role: '집사',
    dob: '1982-04-15',
    phone: '010-2345-6789',
    cellGroup: '요한 셀',
    address: '서울시 강남구',
  },
  {
    id: 'member-2',
    name: '이은혜',
    role: '권사',
    dob: '1978-11-03',
    phone: '010-3456-7890',
    cellGroup: '요한 셀',
    address: '서울시 서초구',
  },
  {
    id: 'member-3',
    name: '박준호',
    role: '형제',
    dob: '1995-07-22',
    phone: '010-4567-8901',
    cellGroup: '요한 셀',
    address: '서울시 송파구',
  },
  {
    id: 'member-4',
    name: '최서연',
    role: '자매',
    dob: '1998-01-08',
    phone: '010-5678-9012',
    cellGroup: '요한 셀',
    address: '경기도 성남시',
  },
  {
    id: 'member-5',
    name: '정우진',
    role: '형제',
    dob: '1992-09-30',
    phone: '010-6789-0123',
    cellGroup: '요한 셀',
    address: '경기도 용인시',
  },
  {
    id: 'member-6',
    name: '한지민',
    role: '자매',
    dob: '1989-12-19',
    phone: '010-7890-1234',
    cellGroup: '베드로 셀',
    address: '서울시 마포구',
  },
  {
    id: 'member-7',
    name: '오성훈',
    role: '집사',
    dob: '1975-06-02',
    phone: '010-8901-2345',
    cellGroup: '베드로 셀',
    address: '인천시 남동구',
  },
  {
    id: 'member-8',
    name: '윤다은',
    role: '자매',
    dob: '2001-03-27',
    phone: '010-9012-3456',
    cellGroup: '바울 셀',
    address: '서울시 영등포구',
  },
];

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s.-]/g, '');
}

export function formatMemberDob(dob: string) {
  const [year, month, day] = dob.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export function searchChurchMembers(query: string, members: ChurchMember[] = DEMO_CHURCH_MEMBERS) {
  const normalizedQuery = normalizeSearchValue(query.trim());
  if (!normalizedQuery) {
    return members;
  }

  return members.filter((member) => {
    const fields = [
      member.name,
      member.role,
      member.dob,
      member.phone,
      member.cellGroup,
      member.address,
    ].map(normalizeSearchValue);

    return fields.some((field) => field.includes(normalizedQuery));
  });
}
