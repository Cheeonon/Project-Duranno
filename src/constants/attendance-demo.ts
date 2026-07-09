export type CellGroupMember = {
  id: string;
  name: string;
  role: string;
};

export const DEMO_CELL_GROUP = {
  name: '요한 셀',
  leader: '김민수 집사',
};

export const DEMO_CELL_GROUP_MEMBERS: CellGroupMember[] = [
  { id: 'member-1', name: '김민수', role: '집사' },
  { id: 'member-2', name: '이은혜', role: '권사' },
  { id: 'member-3', name: '박준호', role: '형제' },
  { id: 'member-4', name: '최서연', role: '자매' },
  { id: 'member-5', name: '정우진', role: '형제' },
];

export function getSundaysInMonth(year: number, month: number) {
  const sundays: Date[] = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    if (date.getDay() === 0) {
      sundays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return sundays;
}

export function formatAttendanceDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getAttendanceKey(memberId: string, date: Date) {
  return `${memberId}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
