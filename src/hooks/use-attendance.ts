import { useCallback, useEffect, useRef, useState } from 'react';

import { formatDateForDb, getAttendanceKey } from '@/lib/attendance-dates';
import { supabase } from '@/lib/supabase';

type AttendanceState = {
  attendance: Record<string, boolean>;
  absenceReasons: Record<string, string>;
  isLoading: boolean;
  error: string | null;
};

export function useAttendance(memberIds: string[], sundays: Date[]) {
  const [state, setState] = useState<AttendanceState>({
    attendance: {},
    absenceReasons: {},
    isLoading: true,
    error: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const loadVersion = useRef(0);

  const memberIdsKey = memberIds.join(',');
  const dateStrings = sundays.map(formatDateForDb);
  const dateStringsKey = dateStrings.join(',');

  useEffect(() => {
    let cancelled = false;
    ++loadVersion.current;

    async function load() {
      if (memberIds.length === 0 || dateStrings.length === 0) {
        setState({ attendance: {}, absenceReasons: {}, isLoading: false, error: null });
        return;
      }

      setState((current) => ({ ...current, isLoading: true, error: null }));
      const { data, error } = await supabase
        .from('attendance_records')
        .select('member_id, attended_date, present, absence_reason')
        .in('member_id', memberIds)
        .in('attended_date', dateStrings);

      if (cancelled) {
        return;
      }

      if (error) {
        setState({ attendance: {}, absenceReasons: {}, isLoading: false, error: error.message });
        return;
      }

      const attendance: Record<string, boolean> = {};
      const absenceReasons: Record<string, string> = {};

      for (const row of data ?? []) {
        const [year, month, day] = row.attended_date.split('-').map(Number);
        const key = getAttendanceKey(row.member_id, new Date(year, month - 1, day));

        if (row.present) {
          attendance[key] = true;
        }
        if (row.absence_reason) {
          absenceReasons[key] = row.absence_reason;
        }
      }

      setState({ attendance, absenceReasons, isLoading: false, error: null });
    }

    void load().catch(() => {
      if (!cancelled) setState((current) => ({ ...current, isLoading: false,
        error: '출석 정보를 불러오지 못했습니다. 다시 시도해주세요.' }));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIdsKey, dateStringsKey]);

  // A key can only have one write in flight. Commit UI state after the DB
  // confirms the saved row, so failures never appear as successful changes.
  const pendingWrites = useRef(new Set<string>());
  const saveRecord = useCallback(async (
    memberId: string, date: Date, present: boolean, reason: string | null | undefined,
  ): Promise<boolean> => {
    const key = getAttendanceKey(memberId, date);
    if (pendingWrites.current.has(key)) return false;
    pendingWrites.current.add(key);
    const version = loadVersion.current;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('attendance_records')
        .upsert({ member_id: memberId, attended_date: formatDateForDb(date),
          present, ...(reason !== undefined ? { absence_reason: reason } : {}) },
          { onConflict: 'member_id,attended_date' })
        .select('present, absence_reason').single();
      if (error || !data) throw error ?? new Error('저장 결과를 확인하지 못했습니다.');
      if (version !== loadVersion.current) return true;
      setState((current) => {
        const absenceReasons = { ...current.absenceReasons };
        if (data.absence_reason) absenceReasons[key] = data.absence_reason;
        else delete absenceReasons[key];
        return { ...current, attendance: { ...current.attendance, [key]: Boolean(data.present) },
          absenceReasons, error: null };
      });
      return true;
    } catch {
      if (version === loadVersion.current) setState((current) => ({ ...current,
        error: '출석 저장에 실패했습니다. 연결을 확인하고 다시 시도해주세요.' }));
      return false;
    } finally {
      pendingWrites.current.delete(key);
      setIsSaving(pendingWrites.current.size > 0);
    }
  }, []);

  const setPresent = useCallback((memberId: string, date: Date, present: boolean) =>
    saveRecord(memberId, date, present, present ? null : undefined), [saveRecord]);

  const setAbsenceReason = useCallback((memberId: string, date: Date, reason: string | null) =>
    saveRecord(memberId, date, false, reason), [saveRecord]);

  /**
   * Prefill helper: current-date reason if set, otherwise the member's most recent
   * prior absence reason (across months).
   */
  const getPrefillAbsenceReason = useCallback(
    async (memberId: string, date: Date) => {
      const key = getAttendanceKey(memberId, date);
      const existing = state.absenceReasons[key]?.trim();
      if (existing) {
        return existing;
      }

      const dateStr = formatDateForDb(date);
      const { data, error } = await supabase
        .from('attendance_records')
        .select('absence_reason')
        .eq('member_id', memberId)
        .not('absence_reason', 'is', null)
        .neq('absence_reason', '')
        .lt('attended_date', dateStr)
        .order('attended_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('이전 결석 사유 조회 실패:', error.message);
        return '';
      }

      return data?.absence_reason?.trim() ?? '';
    },
    [state.absenceReasons],
  );

  return { ...state, isSaving, setPresent, setAbsenceReason, getPrefillAbsenceReason };
}
