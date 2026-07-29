import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint }: HintRowProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={styles.stepRow}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hint ? (
        <ThemedView
          type="backgroundSelected"
          style={[
            styles.codeSnippet,
            isDark ? styles.codeSnippetShadowDark : styles.codeSnippetShadowLight,
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  codeSnippetShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  codeSnippetShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
});
