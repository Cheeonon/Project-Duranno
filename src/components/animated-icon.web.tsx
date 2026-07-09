import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, Easing } from 'react-native-reanimated';

const DURATION = 300;
const LOGO_ASPECT_RATIO = 1024 / 915;
const LOGO_WIDTH = 140;

export function AnimatedSplashOverlay() {
  return null;
}

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

export function AnimatedIcon() {
  const [animationKey, setAnimationKey] = useState(0);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }

      setAnimationKey((key) => key + 1);
    }, []),
  );

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        key={animationKey}
        style={styles.imageContainer}
        entering={logoKeyframe.duration(DURATION)}>
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
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT_RATIO,
  },
  image: {
    width: LOGO_WIDTH,
    aspectRatio: LOGO_ASPECT_RATIO,
  },
});
