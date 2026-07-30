import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Web: skip stack animation — list screens feel snappier without a fade.
        animation: Platform.OS === 'web' ? 'none' : 'fade',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animationDuration: 160,
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="members" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
