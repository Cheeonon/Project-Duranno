/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** Deep leaf ink — soft enough to feel natural, dark enough to read */
    text: '#1C2B1F',
    /** Clean mist — nearly white with a quiet green cast */
    background: '#F7FAF7',
    /** Soft sage surfaces for cards / panels */
    backgroundElement: '#EAF2EB',
    /** Selected / pressed moss wash */
    backgroundSelected: '#D5E6D8',
    textSecondary: '#5F7264',
  },
  dark: {
    text: '#E8F0EA',
    /** Quiet forest night */
    background: '#0F1611',
    backgroundElement: '#1A2420',
    backgroundSelected: '#2A3830',
    textSecondary: '#9AABA0',
  },
} as const;

/** Primary accent used for buttons, checkmarks, and focus states. */
export const Accent = {
  green: '#22C55E',
  greenMuted: '#16A34A',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

// Standard type scale. 11px is the accepted floor for legible auxiliary text
// (captions/labels/timestamps) — nothing in the app should render smaller
// than `micro`. 16px (`default`) is also the minimum for text inputs, since
// anything below that triggers automatic zoom on iOS Safari.
export const FontSize = {
  micro: 11,
  caption: 12,
  small: 13,
  body: 14,
  default: 16,
  heading: 20,
  hero: 22,
  /** Sized for a phone column (~390–430px), not a desktop hero. */
  subtitle: 28,
  title: 36,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** Web top nav height — includes extra top padding so the bar sits below the edge. */
export const TopTabInset = Platform.select({ web: Spacing.five + Spacing.four, default: 0 }) ?? 0;
/** Phone-width content column used across every screen (web + native). */
export const MobileShellWidth = 430;
export const MaxContentWidth = MobileShellWidth;
