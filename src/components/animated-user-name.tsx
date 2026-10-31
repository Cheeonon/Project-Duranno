import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FontSize, KoreanFont } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHomeTextScale } from '@/contexts/home-text-scale';

type AnimatedUserNameProps = {
  name: string;
  /** Overrides the default hero-sized font — lets callers make the name stand out more. */
  fontSize?: number;
  lineHeight?: number;
};

export function AnimatedUserName({ name, fontSize = FontSize.hero, lineHeight = 32 }: AnimatedUserNameProps) {
  const theme = useTheme();
  const { scaled } = useHomeTextScale();
  const scale = useSharedValue(1);

  const playScale = useCallback(() => {
    scale.value = 1;
    scale.value = withSequence(
      withTiming(1.04, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 340, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [scale]);

  useFocusEffect(
    useCallback(() => {
      playScale();
    }, [playScale]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text
      style={[
        styles.name,
        {
          color: theme.text,
          fontSize: scaled(fontSize),
          lineHeight: scaled(lineHeight),
        },
        animatedStyle,
      ]}>
      {name}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  name: {
    fontWeight: '700',
    fontFamily: KoreanFont,
  },
});
