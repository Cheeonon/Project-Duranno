import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

export const PANEL_ANIMATION_DURATION = 350;
const ANIMATION_DURATION = PANEL_ANIMATION_DURATION;
// Mirrors CSS `transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1)`.
const ANIMATION_EASING = Easing.bezier(0.25, 1, 0.5, 1);

type CollapsiblePanelProps = {
  isOpen: boolean;
  children: ReactNode;
  /**
   * Skip content-measurement and animate straight to this height instead —
   * lets multiple panels share one fixed footprint (e.g. the home
   * quick-action panels, which must all line up at the same top/bottom).
   */
  height?: number;
};

export function CollapsiblePanel({ isOpen, children, height }: CollapsiblePanelProps) {
  const contentHeight = useSharedValue(0);
  const animatedHeight = useSharedValue(0);
  const lockedHeightRef = useRef<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    if (height != null) {
      return;
    }

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
      const targetHeight = height ?? lockedHeightRef.current ?? contentHeight.value;

      animatedHeight.value = withTiming(targetHeight, {
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
      });
      return;
    }

    lockedHeightRef.current = null;
    animatedHeight.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    });
  }, [animatedHeight, contentHeight, height, isOpen]);

  const containerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View onLayout={onLayout} style={[styles.content, height != null && styles.contentFixed]}>
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
  contentFixed: {
    flex: 1,
  },
});
