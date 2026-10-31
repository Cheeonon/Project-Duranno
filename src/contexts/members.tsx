import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { fetchMembers } from '@/lib/members';
import type { Member } from '@/types/member';

type MembersState = { members: Member[]; isLoading: boolean; error: string | null };
type MembersContextValue = MembersState & { refresh: () => Promise<void> };
const MembersContext = createContext<MembersContextValue | null>(null);

// Scoped to the authenticated account by the app layout. Every screen observes
// the same list, including after edits and profile photo updates.
export function MembersProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MembersState>({ members: [], isLoading: true, error: null });
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const members = await fetchMembers();
      if (request !== requestId.current) return;
      setState({ members, isLoading: false, error: null });
    } catch (error) {
      if (request !== requestId.current) return;
      setState((current) => ({ ...current, isLoading: false,
        error: error instanceof Error ? error.message : '성도 정보를 불러오지 못했습니다. 다시 시도해주세요.' }));
    }
  }, []);

  useEffect(() => {
    // Load external data once per account; refresh is also used after writes.
    void refresh();
    return () => { requestId.current += 1; };
  }, [refresh]);

  return <MembersContext.Provider value={{ ...state, refresh }}>{children}</MembersContext.Provider>;
}

export function useMembers() {
  const context = useContext(MembersContext);
  if (!context) throw new Error('useMembers must be used within MembersProvider');
  return context;
}
