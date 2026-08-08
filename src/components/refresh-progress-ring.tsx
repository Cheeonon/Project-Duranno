import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Accent } from '@/constants/theme';

const SIZE = 34;

type RefreshProgressRingProps = {
  /** 0–1 fill while pulling */
  progress: number;
  refreshing: boolean;
  complete?: boolean;
  color: string;
  trackColor: string;
};

/**
 * Pull ring that fills to a full circle, then spins while refreshing,
 * then briefly shows a filled complete state.
 */
export function RefreshProgressRing({
  progress,
  refreshing,
  complete = false,
  color,
  trackColor,
}: RefreshProgressRingProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const clamped = Math.max(0, Math.min(1, progress));
  const fill = refreshing || complete ? 1 : clamped;
  const ready = fill >= 0.98;

  useEffect(() => {
    if (refreshing) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 750, easing: Easing.linear }),
        -1,
        false,
      );
      scale.value = withTiming(1, { duration: 120 });
      return;
    }

    cancelAnimation(rotation);
    rotation.value = withTiming(0, { duration: 120 });
  }, [refreshing, rotation, scale]);

  useEffect(() => {
    if (complete) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 140, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 160, easing: Easing.inOut(Easing.cubic) }),
      );
      return;
    }

    if (ready && !refreshing) {
      scale.value = withTiming(1.06, { duration: 120 });
    } else if (!refreshing) {
      scale.value = withTiming(1, { duration: 120 });
    }
  }, [complete, ready, refreshing, scale]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const completeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (complete) {
    return (
      <Animated.View
        style={[styles.box, styles.complete, { backgroundColor: Accent.green }, completeStyle]}>
        <Text style={styles.check}>✓</Text>
      </Animated.View>
    );
  }

  if (Platform.OS === 'web') {
    const degrees = Math.round(fill * 360);
    return (
      <Animated.View style={[styles.box, spinStyle]}>
        <View
          style={[
            styles.webRing,
            {
              // @ts-expect-error web-only CSS properties
              background: `conic-gradient(from -90deg, ${color} ${degrees}deg, ${trackColor} 0deg)`,
              WebkitMask:
                'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            },
          ]}
        />
      </Animated.View>
    );
  }

  // Native: full ring when ready/refreshing; otherwise a growing arc approximation.
  return (
    <Animated.View style={[styles.box, spinStyle]}>
      <View style={[styles.nativeTrack, { borderColor: trackColor }]} />
      {ready || refreshing ? (
        <View style={[styles.nativeFull, { borderColor: color }]} />
      ) : (
        <View
          style={[
            styles.nativeArc,
            {
              borderTopColor: color,
              borderRightColor: fill > 0.25 ? color : 'transparent',
              borderBottomColor: fill > 0.5 ? color : 'transparent',
              borderLeftColor: fill > 0.75 ? color : 'transparent',
              transform: [{ rotate: `${-90 + fill * 270}deg` }],
              opacity: fill > 0.02 ? 1 : 0,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complete: {
    borderWidth: 0,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: -1,
  },
  webRing: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  nativeTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: 3,
  },
  nativeFull: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: 3,
  },
  nativeArc: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
});
