import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  authenticateBiometric, isBiometricAvailable, isNativeBiometricPlatform,
  readBiometricPreference, writeBiometricPreference,
} from '@/lib/biometric-auth';
import { supabase } from '@/lib/supabase';

type LockContext = {
  enabled: boolean;
  available: boolean;
  busy: boolean;
  error: string | null;
  setEnabled: (enabled: boolean) => Promise<void>;
};
const BiometricLockContext = createContext<LockContext | null>(null);

// Root mounts a new provider for each account, preventing state leaking between users.
export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const { session, passwordSignInUserId } = useAuth();
  const userId = session?.user.id;
  const needsProtection = isNativeBiometricPlatform && Boolean(userId);
  const [ready, setReady] = useState(!needsProtection);
  const [enabled, setEnabledState] = useState(false);
  const [available, setAvailable] = useState(false);
  const [locked, setLocked] = useState(needsProtection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabledRef = useRef(needsProtection);
  const operation = useRef(false);
  const lifecycle = useRef(0);
  const mounted = useRef(true);

  const initialize = useCallback(async () => {
    if (!userId || !isNativeBiometricPlatform) return;
    try {
      const preference = await readBiometricPreference(userId);
      const supported = await isBiometricAvailable().catch(() => false);
      if (!mounted.current) return;
      enabledRef.current = preference;
      setEnabledState(preference);
      setAvailable(supported);
      setLocked(preference && (passwordSignInUserId !== userId || AppState.currentState !== 'active'));
      setError(null);
      setReady(true);
    } catch {
      if (mounted.current) setError('잠금 설정을 확인하지 못했습니다. 다시 시도해주세요.');
    }
  }, [userId, passwordSignInUserId]);

  useEffect(() => {
    mounted.current = true;
    if (!needsProtection) return;
    const subscription = AppState.addEventListener('change', (next) => {
      // iOS biometric prompts themselves cause an inactive transition. Ignore only
      // that transition; a real background transition always invalidates the prompt.
      if (next === 'background' || (next === 'inactive' && !operation.current)) {
        lifecycle.current += 1;
        if (enabledRef.current) setLocked(true);
      }
    });
    // Hydrate a persisted device preference; this effect synchronizes with SecureStore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
    return () => {
      mounted.current = false;
      lifecycle.current += 1;
      subscription.remove();
    };
  }, [initialize, needsProtection]);

  const authenticate = async () => {
    const version = lifecycle.current;
    const result = await authenticateBiometric();
    return result.success && mounted.current && version === lifecycle.current;
  };

  const unlock = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      if (await authenticate()) setLocked(false);
      else if (mounted.current) setError('잠금을 해제하지 못했습니다. 다시 시도하거나 비밀번호로 로그인해주세요.');
    } catch {
      if (mounted.current) setError('생체인증을 사용할 수 없습니다. 비밀번호로 다시 로그인해주세요.');
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const setEnabled = async (next: boolean) => {
    if (!userId || !isNativeBiometricPlatform || operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!(await isBiometricAvailable())) {
        setError('기기 설정에서 Face ID 또는 지문을 먼저 등록해주세요.');
        return;
      }
      if (!(await authenticate())) {
        if (mounted.current) setError('생체인증이 완료되지 않아 설정을 변경하지 않았습니다.');
        return;
      }
      const version = lifecycle.current;
      await writeBiometricPreference(userId, next);
      if (!mounted.current) return;
      enabledRef.current = next;
      setEnabledState(next);
      setLocked(next && version !== lifecycle.current);
    } catch {
      if (mounted.current) setError('생체인증 잠금 설정을 변경하지 못했습니다. 다시 시도해주세요.');
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const passwordLogin = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
    } catch {
      if (mounted.current) setError('로그인 화면으로 이동하지 못했습니다. 연결을 확인하고 다시 시도해주세요.');
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <BiometricLockContext.Provider value={{ enabled, available, busy, error, setEnabled }}>
      {needsProtection && (!ready || locked) ? (
        <ThemedView style={styles.lockScreen}>
          <View style={styles.lockContent}>
            <ThemedText type="subtitle">두란노</ThemedText>
            <ThemedText type="smallBold">앱이 잠겨 있습니다.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Face ID 또는 지문으로 잠금을 해제해주세요.
            </ThemedText>
            {!ready && !error && <ActivityIndicator />}
            {error && <ThemedText type="small">{error}</ThemedText>}
            <Button loading={busy} disabled={!ready && !error}
              onPress={() => { void (ready ? unlock() : initialize()); }}>
              {ready ? '잠금 해제' : '다시 시도'}
            </Button>
            <Button variant="ghost" disabled={busy} onPress={() => { void passwordLogin(); }}>
              이메일·비밀번호로 다시 로그인
            </Button>
          </View>
        </ThemedView>
      ) : children}
    </BiometricLockContext.Provider>
  );
}

export function useBiometricLock() {
  const context = useContext(BiometricLockContext);
  if (!context) throw new Error('useBiometricLock must be used within BiometricLockProvider');
  return context;
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  lockContent: { width: '100%', maxWidth: 360, gap: Spacing.three },
});
