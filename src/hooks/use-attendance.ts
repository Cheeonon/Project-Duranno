import { useCallback, useEffect, useState } from 'react';

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

  const memberIdsKey = memberIds.join(',');
  const dateStrings = sundays.map(formatDateForDb);
  const dateStringsKey = dateStrings.join(',');

  useEffect(() => {
    let cancelled = false;

    async function ensureAndLoad() {
      if (memberIds.length === 0 || dateStrings.length === 0) {
        setState({ attendance: {}, absenceReasons: {}, isLoading: false, error: null });
        return;
      }

      // Pre-create a row for every member × Sunday being viewed, so the month is
      // fully queryable even before anyone marks it. Best-effort: read-only roles
      // (사역자/재정) can't insert, and that's fine — they just won't seed rows.
      const placeholders = memberIds.flatMap((memberId) =>
        dateStrings.map((attendedDate) => ({ member_id: memberId, attended_date: attendedDate })),
      );
      await supabase
        .from('attendance_records')
        .upsert(placeholders, { onConflict: 'member_id,attended_date', ignoreDuplicates: true });

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

    ensureAndLoad();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIdsKey, dateStringsKey]);

  const setPresent = useCallback((memberId: string, date: Date, present: boolean) => {
    const key = getAttendanceKey(memberId, date);

    setState((current) => {
      const attendance = { ...current.attendance, [key]: present };
      const absenceReasons = { ...current.absenceReasons };
      if (present) {
        delete absenceReasons[key];
      }
      return { ...current, attendance, absenceReasons };
    });

    supabase
      .from('attendance_records')
      .update({ present, absence_reason: present ? null : undefined })
      .eq('member_id', memberId)
      .eq('attended_date', formatDateForDb(date))
      .then(({ error }) => {
        if (error) {
          console.error('출석 저장 실패:', error.message);
        }
      });
  }, []);

  const setAbsenceReason = useCallback((memberId: string, date: Date, reason: string | null) => {
    const key = getAttendanceKey(memberId, date);

    setState((current) => {
      const attendance = { ...current.attendance, [key]: false };
      const absenceReasons = { ...current.absenceReasons };
      if (reason) {
        absenceReasons[key] = reason;
      } else {
        delete absenceReasons[key];
      }
      return { ...current, attendance, absenceReasons };
    });

    supabase
      .from('attendance_records')
      .update({ present: false, absence_reason: reason })
      .eq('member_id', memberId)
      .eq('attended_date', formatDateForDb(date))
      .then(({ error }) => {
        if (error) {
          console.error('결석 사유 저장 실패:', error.message);
        }
      });
  }, []);

  return { ...state, setPresent, setAbsenceReason };
}
