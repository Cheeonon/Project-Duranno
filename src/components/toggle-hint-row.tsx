import { useRef, type ReactNode, type RefObject } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import { CollapsiblePanel } from './collapsible-panel';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// When a row expands, scroll so its header lands this far from the top of
// the screen — not "however much the panel grew," a fixed target position.
const EXPANDED_HEADER_TOP_OFFSET = 10;

type ToggleHintRowProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  hint?: ReactNode;
  children?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  // Shared with the parent's ScrollView — must be the same live instance the
  // parent wires to onScroll, not a fresh usePreservedCollapse() call here,
  // otherwise this component's own scrollOffsetRef never tracks real scroll
  // position (see src/hooks/use-preserved-collapse.ts callers).
  collapseWithPreservedPosition?: (
    anchorRef: RefObject<View | null>,
    onCollapse: () => void,
  ) => void;
  scrollOffsetRef?: RefObject<number>;
};

export function ToggleHintRow({
  title,
  isOpen,
  onToggle,
  hint,
  children,
  scrollRef,
  collapseWithPreservedPosition,
  scrollOffsetRef,
}: ToggleHintRowProps) {
  const isDark = useColorScheme() === 'dark';
  // Wraps header + panel together so collapse can read its screen position
  // (to counteract scroll jumps as content above shrinks) and so expand can
  // scroll it to a fixed position near the top.
  const containerRef = useRef<View>(null);

  const handlePress = () => {
    if (!scrollRef) {
      onToggle();
      return;
    }

    if (isOpen) {
      if (collapseWithPreservedPosition) {
        collapseWithPreservedPosition(containerRef, onToggle);
      } else {
        onToggle();
      }
      return;
    }

    // Expand: scroll so this row's header ends up just below the top of the
    // screen, regardless of how tall the panel ends up once it's open.
    if (scrollOffsetRef) {
      containerRef.current?.measureInWindow((_x, headerTop) => {
        const delta = headerTop - EXPANDED_HEADER_TOP_OFFSET;
        if (delta > 0.5) {
          scrollRef.current?.scrollTo({ y: scrollOffsetRef.current + delta, animated: true });
        }
      });
    }
    onToggle();
  };

  return (
    <View ref={containerRef}>
      <ThemedView
        type="backgroundSelected"
        style={[styles.wrapper, isDark ? styles.wrapperShadowDark : styles.wrapperShadowLight]}>
        <Pressable
          accessibilityLabel={`${title} ${isOpen ? '닫기' : '열기'}`}
          onPress={handlePress}
          style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedView
            type="background"
            style={[styles.toggleBadge, isOpen && styles.toggleBadgeOpen]}>
            <ThemedText type="small" themeColor="textSecondary">
              {hint ?? (isOpen ? '닫기' : '열기')}
            </ThemedText>
          </ThemedView>
        </Pressable>

        <CollapsiblePanel isOpen={isOpen}>{children}</CollapsiblePanel>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
  wrapperShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  wrapperShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  toggleBadge: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  toggleBadgeOpen: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pressed: {
    opacity: 0.7,
  },
});
