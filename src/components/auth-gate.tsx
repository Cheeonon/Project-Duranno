import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/contexts/auth-context';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const onLoginScreen = segments[0] === 'login';

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user && !onLoginScreen) {
      router.replace('/login');
      return;
    }

    if (user && onLoginScreen) {
      router.replace('/');
    }
  }, [isReady, onLoginScreen, router, user]);

  if (!isReady) {
    return null;
  }

  if (!user && !onLoginScreen) {
    return null;
  }

  if (!user) {
    return <Slot />;
  }

  return children;
}
