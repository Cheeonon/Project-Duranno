import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { ChurchPosition, MemberPermission } from '@/types/member';

type Profile = {
  id: string;
  memberId: string;
  nameKo: string;
  position: ChurchPosition;
  permission: MemberPermission;
  cellLeaderId: string | null;
  cellGroup: string;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string | undefined): Promise<Profile | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, member_id, members(name_ko, position, permission, cell_leader_id, cell_leader:members!cell_leader_id(name_ko))',
    )
    .eq('id', userId)
    .single();

  const member = Array.isArray(data?.members) ? data.members[0] : data?.members;

  if (error || !data || !member) {
    return null;
  }

  const leader = Array.isArray(member.cell_leader) ? member.cell_leader[0] : member.cell_leader;

  return {
    id: data.id,
    memberId: data.member_id,
    nameKo: member.name_ko,
    position: member.position as ChurchPosition,
    permission: member.permission as MemberPermission,
    cellLeaderId: member.cell_leader_id,
    cellGroup: `${leader ? leader.name_ko : member.name_ko} 셀`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchProfile(session?.user.id).then((nextProfile) => {
      if (!cancelled) {
        setProfile(nextProfile);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? '이메일 또는 비밀번호가 올바르지 않습니다.' : null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      changePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error ? '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' : null };
      },
    }),
    [session, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
