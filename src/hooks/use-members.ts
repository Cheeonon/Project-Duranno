import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ChurchPosition, Gender, Member, MemberPermission } from '@/types/member';

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

function mapRow(row: MemberRow): Member {
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
    previousCellGroups: [],
    address: row.address ?? '',
    gender: row.gender as Gender,
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

    setState({ members: (data as unknown as MemberRow[]).map(mapRow), isLoading: false, error: null });
  }, []);

  useEffect(() => {
    // `load` is also exposed as `refresh` for callers to invoke after writes —
    // this is the initial fetch-on-mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, refresh: load };
}
