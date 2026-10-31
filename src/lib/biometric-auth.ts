import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const preferenceKey = (userId: string) => `duranno.biometric.${userId}`;
export const isNativeBiometricPlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export async function isBiometricAvailable() {
  if (!isNativeBiometricPlatform) return false;
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

export async function readBiometricPreference(userId: string) {
  return (await SecureStore.getItemAsync(preferenceKey(userId))) === 'enabled';
}

export async function writeBiometricPreference(userId: string, enabled: boolean) {
  await SecureStore.setItemAsync(preferenceKey(userId), enabled ? 'enabled' : 'disabled', {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function authenticateBiometric() {
  return LocalAuthentication.authenticateAsync({
    promptMessage: '두란노 잠금 해제',
    cancelLabel: '취소',
    disableDeviceFallback: true,
    fallbackLabel: '',
    biometricsSecurityLevel: 'strong',
  });
}
