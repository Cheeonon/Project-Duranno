import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO_AUTH_USERS, findDemoUserByLoginId, resolveLoginId, type AuthUser } from '@/constants/auth-demo';
import {
  clearAuthSession,
  loadPersistedUserId,
  loadUserPasswordOverride,
  saveAuthSession,
  saveUserPasswordOverride,
} from '@/utils/auth-storage';

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (
    loginId: string,
    password: string,
    stayLoggedIn?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function withEffectivePassword(user: AuthUser): Promise<AuthUser> {
  const passwordOverride = await loadUserPasswordOverride(user.id);

  return {
    ...user,
    password: passwordOverride ?? user.password,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const userId = await loadPersistedUserId();
        const baseUser = DEMO_AUTH_USERS.find((item) => item.id === userId) ?? null;
        const restoredUser = baseUser ? await withEffectivePassword(baseUser) : null;

        if (isMounted) {
          setUser(restoredUser);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (loginId: string, password: string, stayLoggedIn = false) => {
    const resolvedId = resolveLoginId(loginId);
    const trimmedPassword = password.trim();

    if (!resolvedId || !trimmedPassword) {
      return { success: false, error: '아이디와 비밀번호를 입력해 주세요.' };
    }

    const matchedUser = findDemoUserByLoginId(resolvedId);

    if (!matchedUser) {
      return { success: false, error: '아이디 또는 비밀번호가 틀렸습니다.' };
    }

    const userWithPassword = await withEffectivePassword(matchedUser);

    if (userWithPassword.password !== trimmedPassword) {
      return { success: false, error: '아이디 또는 비밀번호가 틀렸습니다.' };
    }

    setUser(userWithPassword);

    try {
      await saveAuthSession(userWithPassword.id, stayLoggedIn);
    } catch {
      setUser(null);
      return { success: false, error: '로그인 정보를 저장하지 못했습니다. 다시 시도해 주세요.' };
    }

    return { success: true };
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string) => {
      if (!user) {
        return { success: false, error: '로그인된 계정이 없습니다.' };
      }

      const trimmedCurrent = currentPassword.trim();
      const trimmedNew = newPassword.trim();
      const trimmedConfirm = confirmPassword.trim();

      if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
        return { success: false, error: '모든 비밀번호 항목을 입력해 주세요.' };
      }

      if (trimmedCurrent !== user.password) {
        return { success: false, error: '현재 비밀번호가 틀렸습니다.' };
      }

      if (trimmedNew.length < 4) {
        return { success: false, error: '새 비밀번호는 4자 이상이어야 합니다.' };
      }

      if (trimmedNew !== trimmedConfirm) {
        return { success: false, error: '새 비밀번호가 일치하지 않습니다.' };
      }

      if (trimmedNew === trimmedCurrent) {
        return { success: false, error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' };
      }

      await saveUserPasswordOverride(user.id, trimmedNew);
      setUser({ ...user, password: trimmedNew });

      return { success: true };
    },
    [user],
  );

  const logout = useCallback(async () => {
    setUser(null);
    await clearAuthSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      changePassword,
      logout,
    }),
    [changePassword, isReady, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
