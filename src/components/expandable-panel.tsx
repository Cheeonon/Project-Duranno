import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { CollapsiblePanel } from '@/components/collapsible-panel';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ExpandablePanelProps = {
  isOpen: boolean;
  /**
   * Fixed footprint (in px) this panel animates to when open. The home
   * screen computes this from the actual space available between the hero
   * content and the quick-action row, so all three quick-action panels fill
   * that space and line up at the same top and bottom — a panel with less
   * content just leaves blank space, one with more scrolls internally.
   */
  height: number;
  children?: ReactNode;
};

// Card chrome (background/shadow/padding) lives INSIDE CollapsiblePanel, not
// around it — when closed, CollapsiblePanel's height animates to 0 with
// overflow:hidden, so nothing (not even an empty padded card) is visible.
// Trigger for opening/closing lives outside this component (e.g. an icon
// button elsewhere on the screen).
export function ExpandablePanel({ isOpen, height, children }: ExpandablePanelProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <CollapsiblePanel isOpen={isOpen} height={height}>
      <ThemedView
        type="backgroundSelected"
        style={[styles.wrapper, isDark ? Shadow.raised.dark : Shadow.raised.light]}>
        {children}
      </ThemedView>
    </CollapsiblePanel>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: Spacing.two,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
});
