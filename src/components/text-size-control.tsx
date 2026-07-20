import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useHomeTextScale } from '@/contexts/home-text-scale';

export function TextSizeControl() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { scaleLabel, canDecrease, canIncrease, decrease, increase } = useHomeTextScale();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ThemedView type="backgroundElement" style={styles.control}>
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
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: Spacing.two,
    zIndex: 20,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    borderRadius: Spacing.half,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  button: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: FontSize.micro,
    lineHeight: 14,
    fontWeight: '700',
  },
  buttonTextLarge: {
    fontSize: FontSize.micro,
    lineHeight: 14,
    fontWeight: '700',
  },
  label: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: FontSize.micro,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});
