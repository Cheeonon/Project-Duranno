import { useCallback, useEffect, useState } from 'react';

import { mapCalendarEventRow, type CalendarEventRecord, type CalendarEventRow } from '@/lib/calendar-events';
import { supabase } from '@/lib/supabase';

type CalendarEventsState = {
  events: CalendarEventRecord[];
  isLoading: boolean;
  error: string | null;
};

export function useCalendarEvents() {
  const [state, setState] = useState<CalendarEventsState>({
    events: [],
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, detail, category, event_date, recurs_annually')
      .order('event_date');

    if (error || !data) {
      setState({
        events: [],
        isLoading: false,
        error: error?.message ?? '일정을 불러오지 못했습니다.',
      });
      return;
    }

    setState({
      events: (data as CalendarEventRow[]).map(mapCalendarEventRow),
      isLoading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    // `load` is also exposed as `refresh` for callers to invoke after writes —
    // this is the initial fetch-on-mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, refresh: load };
}
