import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animationDuration: Platform.OS === 'android' ? 200 : 200,
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="members" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
