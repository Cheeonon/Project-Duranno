import { Platform } from 'react-native';
import { type ReactNode } from 'react';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

/**
 * Soft enter for stack pushes on web (native stack uses a short fade).
 */
export function StackScreenEnter({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(180).easing(Easing.out(Easing.quad))}
      style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}
