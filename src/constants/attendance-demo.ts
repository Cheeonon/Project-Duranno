export const DEMO_CELL_GROUP = {
  name: '요한 셀',
  leader: '김민수 집사',
};

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
