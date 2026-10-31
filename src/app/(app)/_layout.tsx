import { MembersProvider } from '@/contexts/members';
import { CalendarEventsProvider } from '@/contexts/calendar-events';
import { useAuth } from '@/contexts/auth-context';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AppLayout() {
  const { session } = useAuth();
  return (
    <CalendarEventsProvider key={session?.user.id}>
      <MembersProvider key={session?.user.id}>
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
      </MembersProvider>
    </CalendarEventsProvider>
  );
}
