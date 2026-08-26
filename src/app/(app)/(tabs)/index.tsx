import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AnimatedUserName } from '@/components/animated-user-name';
import { AttendancePanel } from '@/components/attendance-panel';
import { CALENDAR_FILTER_OPTIONS } from '@/components/calendar-filter';
import { PANEL_ANIMATION_DURATION } from '@/components/collapsible-panel';
import { ExpandablePanel } from '@/components/expandable-panel';
import { MemberSearchPanel } from '@/components/member-search-panel';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import {
  Accent,
  BorderRadius,
  BottomTabInset,
  FontSize,
  KoreanFont,
  MaxContentWidth,
  Spacing,
  TopTabInset,
} from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';
import { useTheme } from '@/hooks/use-theme';
import { getUpcomingEvents } from '@/lib/calendar-events';

// The greeting is meant to wrap to exactly two lines by default. At the
// fixed `hero` size that only holds on a standard phone column (~390px+) —
// narrower phones need a smaller base size or the second line spills onto a
// third. Scales linearly between those two widths.
const GREETING_MIN_WIDTH = 340;
const GREETING_MAX_WIDTH = 420;
const GREETING_MIN_FONT_SIZE = 18;

type QuickActionPanel = 'attendance' | 'memberSearch' | 'nextEvent';

// Shrunk on native phones so the quick-action row (icon + caption) doesn't
// get clipped at the bottom of the hero fold — web has more headroom.
const QUICK_ACTION_ICON_SIZE = Platform.select({ web: 62, default: 52 }) ?? 62;

// A touch darker than the shared `Shadow.card` token, just for the
// quick-action circles.
const QUICK_ACTION_SHADOW = {
  light: { shadowOpacity: 0.12 },
  dark: { shadowOpacity: 0.33 },
};

function getGreetingFontSize(width: number) {
  if (width <= GREETING_MIN_WIDTH) {
    return GREETING_MIN_FONT_SIZE;
  }
  if (width >= GREETING_MAX_WIDTH) {
    return FontSize.hero;
  }

  const t = (width - GREETING_MIN_WIDTH) / (GREETING_MAX_WIDTH - GREETING_MIN_WIDTH);
  return Math.round(GREETING_MIN_FONT_SIZE + t * (FontSize.hero - GREETING_MIN_FONT_SIZE));
}

export default function HomeScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const greetingFontSize = getGreetingFontSize(width);
  const heroBlockMinHeight = Math.max(
    0,
    height - insets.top - insets.bottom - TopTabInset - BottomTabInset - Spacing.two - Spacing.four,
  );
  const scrollRef = useRef<ScrollView>(null);
  const { handleScroll, preserveScrollPosition } = usePreservedCollapse(scrollRef);
  const [activePanel, setActivePanel] = useState<QuickActionPanel | null>(null);
  const pendingSwitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quickActionsHeight, setQuickActionsHeight] = useState(0);
  // Fixed proportion of the viewport (like a CSS `70vh`) so all three
  // quick-action panels always line up at the same top/bottom.
  const panelHeight = height * 0.7 - 15;
  const { profile, refreshProfile } = useAuth();
  const { events } = useCalendarEvents();

  const upcomingEvents = useMemo(() => getUpcomingEvents(events, new Date()), [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      setRefreshKey((current) => current + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  const iconColor = theme.text;

  useEffect(() => {
    return () => {
      if (pendingSwitchRef.current) {
        clearTimeout(pendingSwitchRef.current);
      }
    };
  }, []);

  // Landing back on the home tab (e.g. tapping "홈") should never leave a
  // quick-action panel open from a previous visit.
  useFocusEffect(
    useCallback(() => {
      if (pendingSwitchRef.current) {
        clearTimeout(pendingSwitchRef.current);
        pendingSwitchRef.current = null;
      }
      setActivePanel(null);
    }, []),
  );

  const togglePanel = (panel: QuickActionPanel) => {
    if (pendingSwitchRef.current) {
      clearTimeout(pendingSwitchRef.current);
      pendingSwitchRef.current = null;
    }

    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }

    if (activePanel === null) {
      setActivePanel(panel);
      return;
    }

    // Let the currently open panel finish sliding down before the new one
    // opens, instead of collapsing and expanding at the same time.
    setActivePanel(null);
    pendingSwitchRef.current = setTimeout(() => {
      pendingSwitchRef.current = null;
      setActivePanel(panel);
    }, PANEL_ANIMATION_DURATION);
  };

  return (
    <TabScreenSlide tabIndex={0}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={false}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Spacing.two,
                paddingBottom: BottomTabInset + Spacing.two,
              },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.textSecondary}
                colors={[theme.textSecondary]}
              />
            }>
            <View style={[styles.heroActionsBlock, { minHeight: heroBlockMinHeight }]}>
              <ThemedView style={styles.heroSection}>
                <AnimatedIcon />
                <ThemedText
                  type="display"
                  style={[
                    styles.greeting,
                    { fontSize: greetingFontSize, lineHeight: Math.round(greetingFontSize * 1.36) },
                  ]}>
                  소중한{' '}
                  <AnimatedUserName name={profile?.nameKo ?? '성도'} />
                  님,{'\n'}
                  오늘도 교회를 위해 함께 해주셔서 감사해요.
                </ThemedText>
              </ThemedView>

              <View
                style={[styles.panelOverlay, { bottom: quickActionsHeight + Spacing.three }]}
                pointerEvents="box-none">
                <ExpandablePanel isOpen={activePanel === 'nextEvent'} height={panelHeight - 15}>
                  <ThemedView type="backgroundSelected" style={styles.nextEventContainer}>
                    <ThemedText type="smallBold" style={styles.koreanText}>
                      다음 일정
                    </ThemedText>

                    <ScrollView
                      style={[styles.nextEventScroll, { height: panelHeight - 25, marginTop: 5 }]}
                      contentContainerStyle={styles.nextEventList}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}>
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event, index) => (
                          <View
                            key={event.id}
                            style={[
                              styles.eventRow,
                              index > 0 && styles.eventRowSeparator,
                              index > 0 && { borderTopColor: theme.border },
                            ]}>
                            <View
                              style={[
                                styles.highlightDot,
                                {
                                  backgroundColor:
                                    CALENDAR_FILTER_OPTIONS.find((option) => option.id === event.category)?.color ??
                                    Accent.green,
                                },
                              ]}
                            />
                            <View style={styles.eventRowText}>
                              <ThemedText type="smallBold" style={styles.koreanText}>
                                {event.dateLabel} · {event.title}
                              </ThemedText>
                              {event.detail ? (
                                <ThemedText type="small" themeColor="textSecondary" style={styles.koreanText}>
                                  {event.detail}
                                </ThemedText>
                              ) : null}
                            </View>
                          </View>
                        ))
                      ) : (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.koreanText}>
                          등록된 일정이 없어요.
                        </ThemedText>
                      )}
                    </ScrollView>

                    <Button variant="primary" fullWidth onPress={() => router.push('/explore')}>
                      전체 일정 보기
                    </Button>
                  </ThemedView>
                </ExpandablePanel>

                <ExpandablePanel isOpen={activePanel === 'attendance'} height={panelHeight - 15}>
                  <AttendancePanel key={`attendance-${refreshKey}`} />
                </ExpandablePanel>

                <ExpandablePanel isOpen={activePanel === 'memberSearch'} height={panelHeight + 20}>
                  <MemberSearchPanel
                    key={`search-${refreshKey}`}
                    scrollRef={scrollRef}
                    preserveScrollPosition={preserveScrollPosition}
                  />
                </ExpandablePanel>
              </View>

              <View
                style={styles.quickActionsRow}
                onLayout={(event) => setQuickActionsHeight(event.nativeEvent.layout.height)}>
                <Button
                  variant="icon"
                  size={QUICK_ACTION_ICON_SIZE}
                  circleStyle={isDark ? QUICK_ACTION_SHADOW.dark : QUICK_ACTION_SHADOW.light}
                  accessibilityLabel="출결 보기"
                  caption="출결"
                  icon={<Ionicons name="checkmark-done-outline" size={24} color={iconColor} />}
                  onPress={() => togglePanel('attendance')}
                />
                <Button
                  variant="icon"
                  size={QUICK_ACTION_ICON_SIZE}
                  circleStyle={isDark ? QUICK_ACTION_SHADOW.dark : QUICK_ACTION_SHADOW.light}
                  accessibilityLabel="교인 검색"
                  caption="교인검색"
                  icon={<Ionicons name="search-outline" size={22} color={iconColor} />}
                  onPress={() => togglePanel('memberSearch')}
                />
                <Button
                  variant="icon"
                  size={QUICK_ACTION_ICON_SIZE}
                  circleStyle={isDark ? QUICK_ACTION_SHADOW.dark : QUICK_ACTION_SHADOW.light}
                  accessibilityLabel="다음 일정"
                  caption="다음일정"
                  icon={<Ionicons name="calendar-outline" size={22} color={iconColor} />}
                  onPress={() => togglePanel('nextEvent')}
                />
                <Button
                  variant="icon"
                  size={QUICK_ACTION_ICON_SIZE}
                  circleStyle={isDark ? QUICK_ACTION_SHADOW.dark : QUICK_ACTION_SHADOW.light}
                  accessibilityLabel="성도관리로 이동"
                  caption="성도관리"
                  icon={<Ionicons name="people-outline" size={24} color={iconColor} />}
                  onPress={() => router.push('/members')}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </TabScreenSlide>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  heroActionsBlock: {
    flexDirection: 'column',
    position: 'relative',
  },
  panelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: 35,
  },
  greeting: {
    alignSelf: 'stretch',
    textAlign: 'left',
    fontFamily: KoreanFont,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    marginBottom: 10,
  },
  koreanText: {
    fontFamily: KoreanFont,
  },
  nextEventContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  nextEventScroll: {},
  nextEventList: {
    gap: Spacing.three,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  eventRowSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  eventRowText: {
    flex: 1,
    gap: 2,
  },
  highlightDot: {
    marginTop: 6,
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
});
