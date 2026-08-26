import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Accent, BorderRadius, KoreanFont, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

// Pressable's `hovered` state only ever fires on web (react-native-web adds
// it via mouse events) — the core RN type only declares `pressed`, so we
// widen it locally instead of casting to `any` at every call site.
type PressableRenderState = { pressed: boolean; hovered?: boolean };

// Web-only hover feedback: darkens the pressed surface (background + icon/
// text) a touch, via a CSS filter rather than a hardcoded shade, so it reads
// correctly on every variant/color and in both light and dark theme without
// new palette entries. `hovered` is always false on native, so this never
// applies there.
const hoverDim = { filter: 'brightness(0.92)' } as ViewStyle;

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
        {({ hovered }: PressableRenderState) => (
          <>
            <View
              style={[
                styles.iconCircle,
                {
                  width: size,
                  height: size,
                  borderRadius: BorderRadius.full,
                  backgroundColor: theme.backgroundElement,
                },
                isDark ? Shadow.card.dark : Shadow.card.light,
                !isDisabled && hovered && hoverDim,
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
          </>
        )}
      </Pressable>
    );
  }

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed, hovered }: PressableRenderState) => [
          styles.primaryFill,
          fullWidth && styles.fullWidth,
          !isDisabled && hovered && hoverDim,
          pressed && styles.pressedPrimary,
          isDisabled && styles.disabled,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText type="smallBold" style={styles.primaryLabel}>
            {children}
          </ThemedText>
        )}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed, hovered }: PressableRenderState) => [
          styles.pillFill,
          fullWidth && styles.fullWidth,
          { backgroundColor: theme.backgroundSelected },
          isDark ? Shadow.card.dark : Shadow.card.light,
          !isDisabled && hovered && hoverDim,
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
      style={({ pressed, hovered }: PressableRenderState) => [
        styles.ghostFill,
        fullWidth && styles.fullWidth,
        !isDisabled && hovered && hoverDim,
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
  primaryFill: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Accent.green,
  },
  pillFill: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostFill: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
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
