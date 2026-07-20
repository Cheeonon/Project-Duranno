import type { Member } from '@/types/member';

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[\s.-]/g, '');
}

export function formatMemberDob(dob: string) {
  const [year, month, day] = dob.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
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
