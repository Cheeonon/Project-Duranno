import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';
const DURATION = 600;
const LOGO_ASPECT_RATIO = 1024 / 915;
const LOGO_WIDTH = 112;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

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
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image
          style={styles.image}
          source={require('@/assets/images/duranno-logo.png')}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
