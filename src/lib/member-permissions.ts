import type { ChurchPosition, Gender, Member, MemberPermission } from '@/types/member';

export const POSITION_OPTIONS: ChurchPosition[] = [
  '목사',
  '사모',
  '전도사',
  '간사',
  '집사',
  '장로',
  '권사',
  '셀장',
  '새신자 팀원',
  '셀원',
  '회장',
  '부회장',
  '새신자 팀장',
];

export const PERMISSION_OPTIONS: MemberPermission[] = ['성도', '임원', '셀장', '사역자', '재정', '관리자'];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: '남' },
  { value: 'female', label: '여' },
];

export function canEditMember(
  permission: MemberPermission | undefined,
  myEffectiveLeaderId: string | null,
  member: Member,
) {
  if (permission === '임원' || permission === '관리자') {
    return true;
  }
  if (permission === '셀장') {
    return (member.cellLeaderId ?? member.id) === myEffectiveLeaderId;
  }
  return false;
}

