import { useIsFocused } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TabScreenSlideProps = {
  /** 0 = 홈, 1 = 달력, … */
  tabIndex: number;
  children: ReactNode;
};

/**
 * Minimal tab transition — short fade with a tiny horizontal nudge.
 */
export function TabScreenSlide({ tabIndex: _tabIndex, children }: TabScreenSlideProps) {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const hasAnimatedOnce = useRef(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      opacity.value = 1;
      translateX.value = 0;
      return;
    }

    opacity.value = 0.94;
    translateX.value = 10;
    opacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
    translateX.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [isFocused, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
