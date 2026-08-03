import { useCallback, useEffect, useState } from 'react';

import { buildVirtualCellHistory } from '@/lib/cell-history';
import { signMemberPhotoUrls } from '@/lib/member-photos';
import { supabase } from '@/lib/supabase';
import type {
  CellGroupMembership,
  ChurchPosition,
  Gender,
  Member,
  MemberMinistry,
  MemberPermission,
} from '@/types/member';

type MembersState = {
  members: Member[];
  isLoading: boolean;
  error: string | null;
};

const SELECT_COLUMNS =
  'id, name_ko, first_name_en, last_name_en, dob, gender, phone, household_head_id, permission, position, ' +
  'is_married, ministry, ' +
  'address_street, address_unit, address_city, address_province, address_postal_code, ' +
  'cell_leader_id, cell_leader:members!cell_leader_id(name_ko), photo_path';

type MemberRow = {
  id: string;
  name_ko: string;
  first_name_en: string | null;
  last_name_en: string | null;
  household_head_id: string | null;
  permission: string;
  position: string;
  dob: string;
  phone: string | null;
  address_street: string | null;
  address_unit: string | null;
  address_city: string | null;
  address_province: string | null;
  address_postal_code: string | null;
  gender: string;
  is_married: boolean;
  ministry: string;
  cell_leader_id: string | null;
  cell_leader: { name_ko: string } | { name_ko: string }[] | null;
  photo_path: string | null;
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
    firstNameEn: row.first_name_en ?? '',
    lastNameEn: row.last_name_en ?? '',
    householdHeadId: row.household_head_id,
    permission: row.permission as MemberPermission,
    position: row.position as ChurchPosition,
    dob: row.dob,
    phone: row.phone ?? '',
    cellLeaderId: row.cell_leader_id,
    cellGroup: `${leader ? leader.name_ko : row.name_ko} 셀`,
    previousCellGroups,
    addressStreet: row.address_street ?? '',
    addressUnit: row.address_unit ?? '',
    addressCity: row.address_city ?? '',
    addressProvince: row.address_province ?? '',
    addressPostalCode: row.address_postal_code ?? '',
    gender: row.gender as Gender,
    isMarried: Boolean(row.is_married),
    ministry: (row.ministry === '청년부' ? '청년부' : '장년부') as MemberMinistry,
    photoPath: row.photo_path,
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

    // Paint the list immediately — signed photo URLs can arrive a moment later.
    setState({ members: withHistory, isLoading: false, error: null });

    const photoPaths = withHistory
      .map((member) => member.photoPath)
      .filter((path): path is string => Boolean(path));

    if (photoPaths.length === 0) {
      return;
    }

    const photoUrlByPath = await signMemberPhotoUrls(photoPaths);
    const withPhotos = withHistory.map((member) => ({
      ...member,
      photoUrl: member.photoPath ? (photoUrlByPath.get(member.photoPath) ?? null) : null,
    }));

    setState({ members: withPhotos, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    // `load` is also exposed as `refresh` for callers to invoke after writes —
    // this is the initial fetch-on-mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, refresh: load };
}
