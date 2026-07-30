import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RefreshProgressRing } from '@/components/refresh-progress-ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PULL_THRESHOLD = 72;
const PULL_MAX = 120;
const COMPLETE_HOLD_MS = 420;
const HIDE_MS = 240;

type PullEdge = 'top' | 'bottom' | null;

type PullToRefreshScrollViewProps = Omit<ScrollViewProps, 'refreshControl'> & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Pull-to-refresh that shows a circular spinner above the page.
 * Native uses RefreshControl; web translates the whole page on overscroll
 * at both the top (refresh) and bottom (rubber-band), even with no scroll room.
 */
export const PullToRefreshScrollView = forwardRef(function PullToRefreshScrollView(
  {
    refreshing,
    onRefresh,
    children,
    onScroll,
    scrollEventThrottle = 16,
    contentContainerStyle,
    style,
    ...rest
  }: PullToRefreshScrollViewProps,
  ref: Ref<ScrollView>,
) {
  const theme = useTheme();
  const scrollOffsetRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const pullStartYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const pullEdgeRef = useRef<PullEdge>(null);
  const pullDistanceRef = useRef(0);
  const wasRefreshingRef = useRef(false);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [ringVisible, setRingVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const pullOffset = useSharedValue(0);
  const indicatorOpacity = useSharedValue(1);

  const isAtTop = useCallback(() => scrollOffsetRef.current <= 1, []);

  const isAtBottom = useCallback(() => {
    const maxOffset = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
    // Short content (no overflow): treat as both top and bottom.
    if (maxOffset <= 1) {
      return true;
    }
    return scrollOffsetRef.current >= maxOffset - 1;
  }, []);

  const clearPullState = useCallback(() => {
    pullDistanceRef.current = 0;
    pullEdgeRef.current = null;
    setPullDistance(0);
    setRingVisible(false);
    setComplete(false);
  }, []);

  const collapsePull = useCallback(() => {
    indicatorOpacity.value = withTiming(0, {
      duration: HIDE_MS * 0.7,
      easing: Easing.out(Easing.quad),
    });
    pullOffset.value = withTiming(
      0,
      { duration: HIDE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(clearPullState)();
        }
      },
    );
  }, [clearPullState, indicatorOpacity, pullOffset]);

  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      scrollOffsetRef.current = contentOffset.y;
      viewportHeightRef.current = layoutMeasurement.height;
      contentHeightRef.current = contentSize.height;
      onScroll?.(event);
    },
    [onScroll],
  );

  const triggerRefresh = useCallback(() => {
    void onRefresh();
  }, [onRefresh]);

  const applyPull = useCallback(
    (signed: number, edge: PullEdge) => {
      pullDistanceRef.current = signed;
      pullEdgeRef.current = edge;
      setPullDistance(Math.abs(signed));
      setRingVisible(edge === 'top' && signed > 8);
      if (edge === 'top' && signed > 8) {
        indicatorOpacity.value = 1;
      }
      pullOffset.value = signed;
    },
    [indicatorOpacity, pullOffset],
  );

  useEffect(() => {
    if (refreshing) {
      wasRefreshingRef.current = true;
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
      setComplete(false);
      setRingVisible(true);
      pullEdgeRef.current = 'top';
      indicatorOpacity.value = 1;
      pullOffset.value = withTiming(PULL_THRESHOLD, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    if (!wasRefreshingRef.current) {
      return;
    }

    wasRefreshingRef.current = false;
    setComplete(true);
    setRingVisible(true);
    pullEdgeRef.current = 'top';
    indicatorOpacity.value = 1;
    pullOffset.value = PULL_THRESHOLD;
    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      collapsePull();
    }, COMPLETE_HOLD_MS);

    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only follow refreshing flips
  }, [refreshing]);

  // Non-passive touchmove so overscroll works with no scroll overflow.
  useEffect(() => {
    if (Platform.OS !== 'web' || !rootEl) {
      return;
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || pullStartYRef.current == null || refreshing || complete) {
        return;
      }

      const pageY = event.touches[0]?.clientY;
      if (pageY == null) {
        return;
      }

      const delta = pageY - pullStartYRef.current;
      const edge = pullEdgeRef.current;
      const lockingTop = delta > 0 && (edge === 'top' || (edge == null && isAtTop()));
      const lockingBottom = delta < 0 && (edge === 'bottom' || (edge == null && isAtBottom()));

      if (lockingTop || lockingBottom) {
        if (lockingTop) {
          pullEdgeRef.current = 'top';
        } else {
          pullEdgeRef.current = 'bottom';
        }
        event.preventDefault();
      }
    };

    rootEl.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      rootEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [rootEl, refreshing, complete, isAtTop, isAtBottom]);

  if (Platform.OS !== 'web') {
    return (
      <ScrollView
        ref={setScrollRef}
        style={style}
        contentContainerStyle={contentContainerStyle}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={triggerRefresh}
            tintColor={theme.textSecondary}
            colors={[theme.textSecondary]}
          />
        }
        {...rest}>
        {children}
      </ScrollView>
    );
  }

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const trackColor =
    theme.textSecondary.length === 7 ? `${theme.textSecondary}33` : theme.border;
  const busy = refreshing || complete;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullOffset.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    height: Math.max(pullOffset.value, 0),
  }));

  return (
    <View
      ref={(node) => {
        const el = (node as unknown as HTMLElement | null) ?? null;
        setRootEl((prev) => (prev === el ? prev : el));
      }}
      style={[
        styles.webRoot,
        style,
        { overscrollBehavior: 'none', touchAction: 'pan-y' } as ViewStyle,
      ]}>
      <Animated.View style={[styles.indicatorSlot, indicatorStyle]} pointerEvents="none">
        {ringVisible || refreshing || complete ? (
          <View style={styles.ringWrap}>
            <RefreshProgressRing
              progress={refreshing || complete ? 1 : progress}
              refreshing={refreshing}
              complete={complete}
              color={theme.textSecondary}
              trackColor={trackColor}
            />
          </View>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.webSheet, sheetStyle]}>
        <ScrollView
          ref={setScrollRef}
          style={styles.webScroll}
          contentContainerStyle={[styles.webContentMin, contentContainerStyle]}
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          bounces={false}
          overScrollMode="never"
          onLayout={(event) => {
            viewportHeightRef.current = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_w, h) => {
            contentHeightRef.current = h;
          }}
          onTouchStart={(event: GestureResponderEvent) => {
            if (busy) {
              return;
            }
            // Start tracking at either edge (short pages count as both).
            if (isAtTop() || isAtBottom()) {
              pullStartYRef.current = event.nativeEvent.pageY;
              pullingRef.current = true;
              pullEdgeRef.current = null;
            } else {
              pullStartYRef.current = null;
              pullingRef.current = false;
              pullEdgeRef.current = null;
            }
          }}
          onTouchMove={(event: GestureResponderEvent) => {
            if (!pullingRef.current || pullStartYRef.current == null || busy) {
              return;
            }

            const delta = event.nativeEvent.pageY - pullStartYRef.current;
            let edge = pullEdgeRef.current;

            if (edge == null) {
              if (delta > 4 && isAtTop()) {
                edge = 'top';
              } else if (delta < -4 && isAtBottom()) {
                edge = 'bottom';
              } else {
                return;
              }
              pullEdgeRef.current = edge;
            }

            if (edge === 'top') {
              if (!isAtTop() && pullDistanceRef.current === 0) {
                pullStartYRef.current = null;
                pullingRef.current = false;
                pullEdgeRef.current = null;
                applyPull(0, null);
                return;
              }
              applyPull(Math.min(PULL_MAX, Math.max(0, delta * 0.55)), 'top');
              return;
            }

            // Bottom rubber-band: finger up → content shifts up (negative translate).
            if (!isAtBottom() && pullDistanceRef.current === 0) {
              pullStartYRef.current = null;
              pullingRef.current = false;
              pullEdgeRef.current = null;
              applyPull(0, null);
              return;
            }
            applyPull(-Math.min(PULL_MAX, Math.max(0, -delta * 0.55)), 'bottom');
          }}
          onTouchEnd={() => {
            if (!pullingRef.current) {
              return;
            }

            const edge = pullEdgeRef.current;
            const shouldRefresh =
              edge === 'top' && pullDistanceRef.current >= PULL_THRESHOLD && !busy;

            pullingRef.current = false;
            pullStartYRef.current = null;

            if (shouldRefresh) {
              pullDistanceRef.current = PULL_THRESHOLD;
              pullEdgeRef.current = 'top';
              setPullDistance(PULL_THRESHOLD);
              setRingVisible(true);
              indicatorOpacity.value = 1;
              pullOffset.value = withTiming(PULL_THRESHOLD, { duration: 140 });
              triggerRefresh();
              return;
            }

            collapsePull();
          }}
          onTouchCancel={() => {
            pullingRef.current = false;
            pullStartYRef.current = null;
            pullEdgeRef.current = null;
            if (!busy) {
              collapsePull();
            }
          }}
          {...rest}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webSheet: {
    flex: 1,
  },
  webScroll: {
    flex: 1,
  },
  webContentMin: {
    flexGrow: 1,
  },
  indicatorSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  ringWrap: {
    paddingBottom: Spacing.two,
  },
});
