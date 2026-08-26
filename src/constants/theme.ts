/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** Very dark neutral gray, not pure black */
    text: '#333333',
    /** Soft mist — quiet green, a touch deeper than white */
    background: '#EEF4EF',
    /** Soft sage surfaces for cards / panels */
    backgroundElement: '#DEE8E0',
    /** Selected / pressed moss wash */
    backgroundSelected: '#C9D9CC',
    textSecondary: '#55685A',
    /** Hairline borders / chip outlines */
    border: '#B7C4BA',
  },
  dark: {
    /** Soft mist on night — easy on the eyes, not pure white */
    text: '#EAF1EC',
    /** Softened moss night — dark, but open */
    background: '#202822',
    /** Raised panel — evening leaf, a step above the canvas */
    backgroundElement: '#2B342E',
    /** Selected / pressed — muted forest wash */
    backgroundSelected: '#3B463E',
    textSecondary: '#A3B3A8',
    /** Hairline borders / chip outlines */
    border: '#4A5650',
  },
} as const;

/** Primary accent used for buttons, checkmarks, and focus states. */
export const Accent = {
  green: '#22C55E',
  greenMuted: '#16A34A',
} as const;

/**
 * Green-based gradients (kept on the same ramp as `Accent`, not a new hue).
 * `primary` is for saturated CTA pills; `highlight` is a much softer wash
 * for full-card backgrounds where `primary` would crush text contrast.
 */
export const Gradient = {
  primary: {
    light: ['#4ADE80', '#16A34A'],
    dark: ['#22C55E', '#15803D'],
  },
  highlight: {
    light: ['#EAF6EC', '#DCEFE1'],
    dark: ['#26312A', '#1E2921'],
  },
} as const;

/**
 * Real elevation shadows — replaces the inset-`boxShadow` hack duplicated
 * across card components. `card` for inline sections, `raised` for
 * floating/modal elements. react-native-web maps these to a real CSS
 * `box-shadow`, so no `Platform.select` split is needed.
 */
export const Shadow = {
  card: {
    light: {
      shadowColor: '#1B2E20',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    dark: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 3,
    },
  },
  raised: {
    light: {
      shadowColor: '#1B2E20',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 6,
    },
    dark: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.36,
      shadowRadius: 16,
      elevation: 6,
    },
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Korean-first font stack, centralized — was copy-pasted inline across
 * nearly every screen's StyleSheet. Distinct from `Fonts.sans` below (which
 * is Platform.select/web-CSS-var driven and Latin-first on web).
 */
export const KoreanFont = 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif';

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
  /** Pill / circle radius — RN clamps to half of width/height automatically. */
  full: 999,
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
export const TopTabInset = Platform.select({ web: Spacing.six + Spacing.three, default: 0 }) ?? 0;
/** Phone-width content column used across every screen (web + native). */
export const MobileShellWidth = 430;
export const MaxContentWidth = MobileShellWidth;
