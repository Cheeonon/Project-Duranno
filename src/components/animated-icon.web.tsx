import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DURATION = 300;
const LOGO_ASPECT_RATIO = 1024 / 915;
const LOGO_WIDTH = 112;
const LOGO_HEIGHT = LOGO_WIDTH / LOGO_ASPECT_RATIO;

export function AnimatedSplashOverlay() {
  return null;
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

      playEntrance(280);
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
});
