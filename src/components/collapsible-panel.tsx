import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

const ANIMATION_DURATION = 220;

type CollapsiblePanelProps = {
  isOpen: boolean;
  children: ReactNode;
};

export function CollapsiblePanel({ isOpen, children }: CollapsiblePanelProps) {
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);
  const opacity = useSharedValue(0);
  const lockedHeightRef = useRef<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    contentHeight.value = nextHeight;

    if (!isOpen || lockedHeightRef.current !== null) {
      return;
    }

    if (nextHeight > 0) {
      lockedHeightRef.current = nextHeight;
      animatedHeight.value = nextHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const targetHeight = lockedHeightRef.current ?? contentHeight.value;

      animatedHeight.value = withTiming(targetHeight, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 180 });
      return;
    }

    lockedHeightRef.current = null;
    animatedHeight.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(0, { duration: 150 });
  }, [animatedHeight, contentHeight, isOpen, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View onLayout={onLayout} style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  content: {
    gap: Spacing.two,
  },
});
