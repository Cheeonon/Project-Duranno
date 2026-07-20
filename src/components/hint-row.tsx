import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BorderRadius, Spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint }: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hint ? (
        <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
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
});
