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

// YYYY-MM-DD in local time — never use Date#toISOString() for this, it converts
// to UTC first and can shift the calendar date across midnight in KST (UTC+9).
export function formatDateForDb(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
