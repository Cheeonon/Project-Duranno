import { useRef, type ReactNode, type RefObject } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import { CollapsiblePanel } from './collapsible-panel';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';
import { Spacing } from '@/constants/theme';

type ToggleHintRowProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  hint?: ReactNode;
  children?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
};

export function ToggleHintRow({
  title,
  isOpen,
  onToggle,
  hint,
  children,
  scrollRef,
}: ToggleHintRowProps) {
  const headerRef = useRef<View>(null);
  const { toggleWithPreservedPosition } = usePreservedCollapse(scrollRef ?? { current: null });

  const handlePress = () => {
    if (scrollRef) {
      toggleWithPreservedPosition(isOpen, headerRef, onToggle);
      return;
    }

    onToggle();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        ref={headerRef}
        accessibilityLabel={`${title} ${isOpen ? '닫기' : '열기'}`}
        onPress={handlePress}
        style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedView type="backgroundSelected" style={styles.toggleBadge}>
          <ThemedText type="small" themeColor="textSecondary">
            {hint ?? (isOpen ? '닫기' : '열기')}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <CollapsiblePanel isOpen={isOpen}>{children}</CollapsiblePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
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
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
