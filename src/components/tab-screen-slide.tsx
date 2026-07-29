import { useIsFocused } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Tracks the last focused tab so enter direction can feel like a slide. */
const lastFocusedTabIndex = { current: 0 };

type TabScreenSlideProps = {
  /** 0 = 홈, 1 = 달력, … */
  tabIndex: number;
  children: ReactNode;
};

/**
 * Soft horizontal slide + fade when a tab becomes focused.
 * Forward (home → calendar) enters from the right; back enters from the left.
 */
export function TabScreenSlide({ tabIndex, children }: TabScreenSlideProps) {
  const isFocused = useIsFocused();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const hasAnimatedOnce = useRef(false);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const movingForward = tabIndex >= lastFocusedTabIndex.current;
    lastFocusedTabIndex.current = tabIndex;

    // Skip the very first paint of the initial tab.
    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      translateX.value = 0;
      opacity.value = 1;
      return;
    }

    translateX.value = movingForward ? 48 : -48;
    opacity.value = 0.88;
    translateX.value = withTiming(0, {
      duration: 340,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [isFocused, opacity, tabIndex, translateX]);

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
