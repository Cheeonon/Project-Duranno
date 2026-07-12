import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/auth-context';

export function AuthGate() {
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

  return <Slot />;
}
