import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useMembers } from '@/hooks/use-members';

/** Both home designs refresh the same data, with a key for attendance reloads. */
export function useHomeRefresh() {
  const { refreshProfile } = useAuth();
  const { refresh: refreshEvents } = useCalendarEvents();
  const { refresh: refreshMembers } = useMembers();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pending = useRef(false);

  const onRefresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refreshEvents(), refreshMembers()]);
      setRefreshKey((current) => current + 1);
    } finally {
      pending.current = false;
      setRefreshing(false);
    }
  }, [refreshProfile, refreshEvents, refreshMembers]);

  return { refreshing, refreshKey, onRefresh };
}
