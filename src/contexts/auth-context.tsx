import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { ChurchPosition, MemberPermission } from '@/types/member';

export const SUSPENDED_ACCOUNT_MESSAGE = '활동이 정지되었습니다';

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
  /** True only when the user may enter authenticated screens. */
  canAccessApp: boolean;
  /** Survives login screen remounts during suspended-account sign-in. */
  loginError: string | null;
  clearLoginError: () => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type ProfileFetchResult =
  | { profile: Profile; suspended: false }
  | { profile: null; suspended: true }
  | { profile: null; suspended: false };

async function fetchProfile(userId: string | undefined): Promise<ProfileFetchResult> {
  if (!userId) {
    return { profile: null, suspended: false };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, member_id, is_suspended, members(name_ko, position, permission, cell_leader_id, cell_leader:members!cell_leader_id(name_ko))',
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { profile: null, suspended: false };
  }

  if (data.is_suspended) {
    return { profile: null, suspended: true };
  }

  const member = Array.isArray(data.members) ? data.members[0] : data.members;

  if (!member) {
    return { profile: null, suspended: false };
  }

  const leader = Array.isArray(member.cell_leader) ? member.cell_leader[0] : member.cell_leader;

  return {
    profile: {
      id: data.id,
      memberId: data.member_id,
      nameKo: member.name_ko,
      position: member.position as ChurchPosition,
      permission: member.permission as MemberPermission,
      cellLeaderId: member.cell_leader_id,
      cellGroup: `${leader ? leader.name_ko : member.name_ko} 셀`,
    },
    suspended: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const userId = session?.user.id;

    if (!userId) {
      setProfile(null);
      return;
    }

    setIsLoading(true);

    fetchProfile(userId).then(async (result) => {
      if (cancelled) {
        return;
      }

      if (result.suspended) {
        setProfile(null);
        setLoginError(SUSPENDED_ACCOUNT_MESSAGE);
        await supabase.auth.signOut();
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      setProfile(result.profile);
      setLoginError(null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const canAccessApp = !!session && !!profile;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      canAccessApp,
      loginError,
      clearLoginError: () => setLoginError(null),
      refreshProfile: async () => {
        const result = await fetchProfile(session?.user.id);
        if (result.suspended) {
          setProfile(null);
          setLoginError(SUSPENDED_ACCOUNT_MESSAGE);
          await supabase.auth.signOut();
          return;
        }
        setProfile(result.profile);
      },
      signIn: async (email, password) => {
        setLoginError(null);

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const message = '이메일 또는 비밀번호가 올바르지 않습니다.';
          setLoginError(message);
          return { error: message };
        }

        const result = await fetchProfile(data.user?.id);
        if (result.suspended) {
          setProfile(null);
          setLoginError(SUSPENDED_ACCOUNT_MESSAGE);
          await supabase.auth.signOut();
          return { error: SUSPENDED_ACCOUNT_MESSAGE };
        }

        setProfile(result.profile);
        setLoginError(null);
        setIsLoading(false);
        return { error: null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      changePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error ? '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' : null };
      },
    }),
    [session, profile, isLoading, canAccessApp, loginError],
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
