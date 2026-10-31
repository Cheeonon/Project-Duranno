import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { mapCalendarEventRow, type CalendarEventRecord, type CalendarEventRow } from '@/lib/calendar-events';
import { supabase } from '@/lib/supabase';

type CalendarEventsState = {
  events: CalendarEventRecord[];
  isLoading: boolean;
  error: string | null;
};

type CalendarEventsContextValue = CalendarEventsState & { refresh: () => Promise<void> };
const CalendarEventsContext = createContext<CalendarEventsContextValue | null>(null);

export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const requestId = useRef(0);
  const [state, setState] = useState<CalendarEventsState>({
    events: [],
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, detail, category, event_date, recurs_annually')
        .order('event_date');

      if (request !== requestId.current) return;
      if (error || !data) {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: error?.message ?? '일정을 불러오지 못했습니다.',
        }));
        return;
      }

      setState({
        events: (data as CalendarEventRow[]).map(mapCalendarEventRow),
        isLoading: false,
        error: null,
      });
    } catch {
      if (request === requestId.current) setState((current) => ({ ...current,
        isLoading: false, error: '일정을 불러오지 못했습니다. 다시 시도해주세요.' }));
    }
  }, []);

  useEffect(() => {
    // `load` is also exposed as `refresh` for callers to invoke after writes —
    // this is the initial fetch-on-mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    return () => { requestId.current += 1; };
  }, [load]);

  return <CalendarEventsContext.Provider value={{ ...state, refresh: load }}>
    {children}
  </CalendarEventsContext.Provider>;
}

export function useCalendarEvents() {
  const context = useContext(CalendarEventsContext);
  if (!context) throw new Error('useCalendarEvents must be used within CalendarEventsProvider');
  return context;
}
