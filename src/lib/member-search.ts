import type { Member } from '@/types/member';

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s.-]/g, '');
}

function parseDobParts(dob: string): { year: number; month: number; day: number } | null {
  if (!dob) {
    return null;
  }

  // Prefer YYYY-MM-DD prefix so ISO timestamps like `1982-04-15T00:00:00.000Z` still work.
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(dob.trim());
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

export function formatMemberDob(dob: string) {
  const parts = parseDobParts(dob);
  if (!parts) {
    return dob || '-';
  }

  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

/** Full years completed since birth (만 나이). */
export function getManAge(dob: string, today = new Date()): number | null {
  const parts = parseDobParts(dob);
  if (!parts) {
    return null;
  }

  let age = today.getFullYear() - parts.year;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  if (currentMonth < parts.month || (currentMonth === parts.month && currentDay < parts.day)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatMemberDobWithAge(dob: string) {
  const formatted = formatMemberDob(dob);
  const age = getManAge(dob);
  return age == null ? formatted : `${formatted} · 만 ${age}세`;
}

export function searchChurchMembers(query: string, members: Member[]) {
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
