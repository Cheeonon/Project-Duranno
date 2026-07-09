import { useCallback, useRef, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

const COLLAPSE_SETTLE_MS = 240;

export function usePreservedCollapse(scrollRef: RefObject<ScrollView | null>) {
  const scrollOffsetRef = useRef(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const collapseWithPreservedPosition = useCallback(
    (anchorRef: RefObject<View | null>, onCollapse: () => void) => {
      anchorRef.current?.measureInWindow((_x, viewportY) => {
        onCollapse();

        setTimeout(() => {
          anchorRef.current?.measureInWindow((_x2, newViewportY) => {
            const delta = newViewportY - viewportY;

            if (Math.abs(delta) > 0.5) {
              scrollRef.current?.scrollTo({
                y: Math.max(0, scrollOffsetRef.current + delta),
                animated: false,
              });
            }
          });
        }, COLLAPSE_SETTLE_MS);
      });
    },
    [scrollRef],
  );

  const toggleWithPreservedPosition = useCallback(
    (isOpen: boolean, anchorRef: RefObject<View | null>, onToggle: () => void) => {
      if (isOpen) {
        collapseWithPreservedPosition(anchorRef, onToggle);
        return;
      }

      onToggle();
    },
    [collapseWithPreservedPosition],
  );

  const preserveScrollPosition = useCallback(() => {
    const y = scrollOffsetRef.current;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, [scrollRef]);

  return {
    handleScroll,
    toggleWithPreservedPosition,
    preserveScrollPosition,
    scrollOffsetRef,
  };
}
