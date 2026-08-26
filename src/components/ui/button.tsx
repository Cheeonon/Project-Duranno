import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, BorderRadius, Gradient, KoreanFont, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

export type ButtonProps = {
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Label content — primary/secondary/ghost. Usually a string or <ThemedText>. */
  children?: ReactNode;
  fullWidth?: boolean;
  /** Icon glyph — variant="icon" only, e.g. an @expo/vector-icons element. */
  icon?: ReactNode;
  /** Small "+" badge, top-right of the circle — variant="icon" only. */
  badge?: boolean;
  /** Label under the circle, inside the same tap target — variant="icon" only. */
  caption?: string;
  /** Circle diameter — variant="icon" only. */
  size?: number;
  accessibilityLabel?: string;
};

const DEFAULT_ICON_SIZE = 56;

export function Button({
  variant = 'primary',
  onPress,
  disabled,
  loading,
  style,
  children,
  fullWidth,
  icon,
  badge,
  caption,
  size = DEFAULT_ICON_SIZE,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const isDisabled = disabled || loading;

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? caption}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [styles.iconColumn, pressed && styles.pressedIcon]}>
        <View
          style={[
            styles.iconCircle,
            { width: size, height: size, borderRadius: BorderRadius.full, backgroundColor: theme.backgroundElement },
            isDark ? Shadow.card.dark : Shadow.card.light,
            isDisabled && styles.disabled,
          ]}>
          {loading ? <ActivityIndicator color={theme.text} /> : icon}
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <View style={styles.badgeDot}>
                <ThemedText type="smallBold" style={styles.badgePlus}>
                  +
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>
        {caption ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.caption} numberOfLines={1}>
            {caption}
          </ThemedText>
        ) : null}
      </Pressable>
    );
  }

  if (variant === 'primary') {
    const gradientColors = isDark ? Gradient.primary.dark : Gradient.primary.light;
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          fullWidth && styles.fullWidth,
          isDark ? Shadow.raised.dark : Shadow.raised.light,
          styles.primaryWrapper,
          pressed && styles.pressedPrimary,
          isDisabled && styles.disabled,
          style,
        ]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillFill}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="smallBold" style={styles.primaryLabel}>
              {children}
            </ThemedText>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.pillFill,
          fullWidth && styles.fullWidth,
          { backgroundColor: theme.backgroundSelected },
          isDark ? Shadow.card.dark : Shadow.card.light,
          pressed && styles.pressedSecondary,
          isDisabled && styles.disabled,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <ThemedText type="smallBold" style={styles.secondaryLabel}>
            {children}
          </ThemedText>
        )}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pillFill,
        styles.ghostFill,
        fullWidth && styles.fullWidth,
        { borderColor: theme.border },
        pressed && styles.pressedGhost,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.textSecondary} />
      ) : (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.ghostLabel}>
          {children}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  primaryWrapper: {
    borderRadius: BorderRadius.full,
  },
  pillFill: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostFill: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontFamily: KoreanFont,
  },
  secondaryLabel: {
    fontFamily: KoreanFont,
  },
  ghostLabel: {
    fontFamily: KoreanFont,
  },
  pressedPrimary: {
    opacity: 0.85,
  },
  pressedSecondary: {
    opacity: 0.8,
  },
  pressedGhost: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
  iconColumn: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  pressedIcon: {
    opacity: 0.75,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: KoreanFont,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  badgeDot: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: Accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePlus: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 12,
  },
});
