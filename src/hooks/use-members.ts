import { useCallback, useEffect, useState } from 'react';

import { buildVirtualCellHistory } from '@/lib/cell-history';
import { supabase } from '@/lib/supabase';
import type {
  CellGroupMembership,
  ChurchPosition,
  Gender,
  Member,
  MemberPermission,
} from '@/types/member';

type MembersState = {
  members: Member[];
  isLoading: boolean;
  error: string | null;
};

const SELECT_COLUMNS =
  'id, name_ko, name_en, dob, gender, phone, address, household_head_id, permission, position, ' +
  'cell_leader_id, cell_leader:members!cell_leader_id(name_ko)';

type MemberRow = {
  id: string;
  name_ko: string;
  name_en: string | null;
  household_head_id: string | null;
  permission: string;
  position: string;
  dob: string;
  phone: string | null;
  address: string | null;
  gender: string;
  cell_leader_id: string | null;
  cell_leader: { name_ko: string } | { name_ko: string }[] | null;
};

type HistoryRow = {
  member_id: string;
  cell_leader_id: string | null;
  from_date: string;
  to_date: string;
  cell_leader: { name_ko: string } | { name_ko: string }[] | null;
};

function mapRow(row: MemberRow, previousCellGroups: CellGroupMembership[]): Member {
  const leader = Array.isArray(row.cell_leader) ? row.cell_leader[0] : row.cell_leader;

  return {
    id: row.id,
    nameKo: row.name_ko,
    nameEn: row.name_en ?? '',
    householdHeadId: row.household_head_id,
    permission: row.permission as MemberPermission,
    position: row.position as ChurchPosition,
    dob: row.dob,
    phone: row.phone ?? '',
    cellLeaderId: row.cell_leader_id,
    cellGroup: `${leader ? leader.name_ko : row.name_ko} 셀`,
    previousCellGroups,
    address: row.address ?? '',
    gender: row.gender as Gender,
  };
}

function mapHistoryRow(row: HistoryRow, memberNameById: Map<string, string>): CellGroupMembership {
  const leader = Array.isArray(row.cell_leader) ? row.cell_leader[0] : row.cell_leader;
  const leaderName =
    leader?.name_ko ??
    (row.cell_leader_id ? memberNameById.get(row.cell_leader_id) : null) ??
    memberNameById.get(row.member_id) ??
    '알 수 없음';

  return {
    cellLeaderId: row.cell_leader_id,
    cellGroup: `${leaderName} 셀`,
    from: row.from_date,
    to: row.to_date,
  };
}

export function useMembers() {
  const [state, setState] = useState<MembersState>({
    members: [],
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('members').select(SELECT_COLUMNS);

    if (error || !data) {
      setState({
        members: [],
        isLoading: false,
        error: error?.message ?? '성도 정보를 불러오지 못했습니다.',
      });
      return;
    }

    const rows = data as unknown as MemberRow[];
    const memberIds = rows.map((row) => row.id);
    const memberNameById = new Map(rows.map((row) => [row.id, row.name_ko]));

    const historyByMemberId = new Map<string, CellGroupMembership[]>();
    if (memberIds.length > 0) {
      const { data: historyData } = await supabase
        .from('member_cell_group_history')
        .select(
          'member_id, cell_leader_id, from_date, to_date, cell_leader:members!cell_leader_id(name_ko)',
        )
        .in('member_id', memberIds)
        .order('from_date', { ascending: true });

      for (const row of (historyData as HistoryRow[] | null) ?? []) {
        const entry = mapHistoryRow(row, memberNameById);
        const list = historyByMemberId.get(row.member_id) ?? [];
        list.push(entry);
        historyByMemberId.set(row.member_id, list);
      }
    }

    const mapped = rows.map((row) => mapRow(row, historyByMemberId.get(row.id) ?? []));
    const cellLeaders = mapped.filter((member) => member.permission === '셀장');

    const withHistory = mapped.map((member) => {
      if (member.previousCellGroups.length > 0) {
        return member;
      }
      return {
        ...member,
        previousCellGroups: buildVirtualCellHistory(member, cellLeaders),
      };
    });

    setState({ members: withHistory, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    // `load` is also exposed as `refresh` for callers to invoke after writes —
    // this is the initial fetch-on-mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, refresh: load };
}
