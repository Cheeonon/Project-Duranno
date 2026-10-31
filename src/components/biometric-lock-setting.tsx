import { Platform, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBiometricLock } from '@/contexts/biometric-lock';

export function BiometricLockSetting() {
  const { enabled, available, busy, error, setEnabled } = useBiometricLock();
  if (Platform.OS === 'web') return null;
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedText type="smallBold">생체인증 잠금</ThemedText>
        <Switch value={enabled} disabled={busy || (!available && !enabled)}
          accessibilityLabel="생체인증 잠금"
          onValueChange={(next) => { void setEnabled(next); }} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {available ? '앱을 다시 열면 Face ID 또는 지문으로 잠금을 해제합니다.'
          : '기기 설정에서 Face ID 또는 지문을 등록해주세요.'}
      </ThemedText>
      {error && <ThemedText type="small">{error}</ThemedText>}
    </View>
  );
}
