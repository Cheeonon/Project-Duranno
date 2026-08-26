import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
const DURATION = 600;
const LOGO_ASPECT_RATIO = 1024 / 915;
const LOGO_WIDTH = 112;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;
// How far the glow spreads past the logo before it matches the page
// background exactly — big enough that the radial gradient's outer edge
// fades in seamlessly instead of showing a visible circle boundary.
const GLOW_SIZE = LOGO_WIDTH * 2.6;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = (
    <Image
      style={styles.image}
      source={require('@/assets/images/duranno-logo.png')}
      contentFit="contain"
    />
  );

  const overlayStyle = [styles.splashOverlay, { backgroundColor: colors.background }];

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={overlayStyle}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={overlayStyle}>
      {image}
    </View>
  );
}

export function AnimatedIcon() {
  const entrance = useSharedValue(1);
  const isFirstFocus = useRef(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const playEntrance = useCallback(
    (duration: number) => {
      entrance.value = 0;
      entrance.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    },
    [entrance],
  );

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        playEntrance(DURATION);
        return;
      }

      playEntrance(320);
    }, [playEntrance]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.94 + 0.06 * entrance.value }],
  }));

  return (
    <View style={styles.glowWrapper}>
      <Svg width={GLOW_SIZE} height={GLOW_SIZE} style={styles.glow}>
        <Defs>
          <RadialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="1" stopColor={theme.background} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#logoGlow)" />
      </Svg>

      <View style={styles.iconContainer}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image
            style={styles.image}
            source={require('@/assets/images/duranno-logo.png')}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  iconContainer: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
