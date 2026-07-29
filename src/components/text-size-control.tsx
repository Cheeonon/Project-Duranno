import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useHomeTextScale } from '@/contexts/home-text-scale';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function TextSizeControl() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { scaleLabel, canDecrease, canIncrease, decrease, increase } = useHomeTextScale();

  return (
    <View style={styles.control}>
      <Pressable
        accessibilityLabel="글자 크기 줄이기"
        disabled={!canDecrease}
        onPress={decrease}
        style={({ pressed }) => [
          styles.button,
          !canDecrease && styles.buttonDisabled,
          pressed && canDecrease && styles.pressed,
        ]}>
        <Text style={[styles.buttonText, { color: colors.text }]}>A−</Text>
      </Pressable>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{scaleLabel}</Text>

      <Pressable
        accessibilityLabel="글자 크기 키우기"
        disabled={!canIncrease}
        onPress={increase}
        style={({ pressed }) => [
          styles.button,
          !canIncrease && styles.buttonDisabled,
          pressed && canIncrease && styles.pressed,
        ]}>
        <Text style={[styles.buttonTextLarge, { color: colors.text }]}>A+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: FontSize.small,
    lineHeight: 16,
    fontWeight: '700',
  },
  buttonTextLarge: {
    fontSize: FontSize.small,
    lineHeight: 16,
    fontWeight: '700',
  },
  label: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: FontSize.micro,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});
