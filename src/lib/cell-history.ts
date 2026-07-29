import type { CellGroupMembership, Member } from '@/types/member';

const VIRTUAL_CELL_NAMES = ['마가', '누가', '요한', '베드로', '바울', '야고보'] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Builds 1–2 demo previous-cell periods when the DB has none for a member.
 * Uses other real cell leaders when available; otherwise falls back to named demo cells.
 */
export function buildVirtualCellHistory(
  member: Member,
  cellLeaders: Member[],
): CellGroupMembership[] {
  const hash = hashString(member.id);
  const otherLeaders = cellLeaders.filter(
    (leader) => leader.id !== member.id && leader.id !== (member.cellLeaderId ?? member.id),
  );

  const periodCount = (hash % 2) + 1; // 1 or 2
  const history: CellGroupMembership[] = [];

  for (let index = 0; index < periodCount; index += 1) {
    const leader = otherLeaders[(hash + index) % Math.max(otherLeaders.length, 1)];
    const nameSeed = VIRTUAL_CELL_NAMES[(hash + index * 3) % VIRTUAL_CELL_NAMES.length];
    const cellGroup = leader ? `${leader.nameKo} 셀` : `${nameSeed} 셀`;
    const endYear = 2024 - index;
    const startYear = endYear - 1 - (hash % 2);

    history.push({
      cellLeaderId: leader?.id ?? null,
      cellGroup,
      from: formatIsoDate(startYear, ((hash + index) % 9) + 1, 1),
      to: formatIsoDate(endYear, ((hash + index * 5) % 9) + 3, ((hash + index) % 27) + 1),
      isVirtual: true,
    });
  }

  return history.sort((a, b) => a.from.localeCompare(b.from));
}

export function formatCellHistoryPeriod(from: string, to: string) {
  return `${from.replaceAll('-', '.')} – ${to.replaceAll('-', '.')}`;
}
