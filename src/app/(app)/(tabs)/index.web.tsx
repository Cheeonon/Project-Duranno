import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AnimatedUserName } from '@/components/animated-user-name';
import { AttendancePanel } from '@/components/attendance-panel';
import { CALENDAR_FILTER_OPTIONS } from '@/components/calendar-filter';
import { MemberSearchPanel } from '@/components/member-search-panel';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Accent, BorderRadius, FontSize, KoreanFont, Spacing, TopTabInset } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useTheme } from '@/hooks/use-theme';
import { getUpcomingEvents } from '@/lib/calendar-events';

const HEADER_GAP = Spacing.four;
const GRID_GAP = Spacing.four;

export default function HomeScreen() {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { profile, refreshProfile } = useAuth();
  const { events } = useCalendarEvents();

  const upcomingEvents = useMemo(() => getUpcomingEvents(events, new Date()), [events]);

  // Fills the remaining viewport below the header, like the mobile screen's
  // `heroBlockMinHeight`/`panelHeight` — but here it sizes a persistent
  // two-column grid instead of a single toggled panel.
  const gridHeight = Math.max(
    320,
    height - insets.top - insets.bottom - TopTabInset - Spacing.four * 2 - headerHeight - HEADER_GAP,
  );
  const secondaryCardHeight = (gridHeight - GRID_GAP) / 2;

  useFocusEffect(
    useCallback(() => {
      // No toggled panel state to reset on this layout — kept for parity
      // with the mobile screen's tab-refocus hook in case one is added later.
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      setRefreshKey((current) => current + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  return (
    <TabScreenSlide tabIndex={0}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
              <View style={styles.heroBlock}>
                <AnimatedIcon />
                <ThemedText type="display" style={styles.greeting}>
                  소중한 <AnimatedUserName name={profile?.nameKo ?? '성도'} />
                  님,{'\n'}
                  오늘도 교회를 위해 함께 해주셔서 감사해요.
                </ThemedText>
              </View>

              <View style={styles.headerActions}>
                <Button
                  variant="icon"
                  size={48}
                  loading={refreshing}
                  accessibilityLabel="새로고침"
                  caption="새로고침"
                  icon={<Ionicons name="refresh-outline" size={20} color={theme.text} />}
                  onPress={onRefresh}
                />
                <Button variant="secondary" onPress={() => router.push('/members')}>
                  성도관리
                </Button>
              </View>
            </View>

            <View style={[styles.grid, { minHeight: gridHeight }]}>
              <View style={[styles.columnPrimary, { height: gridHeight }]}>
                <AttendancePanel key={`attendance-${refreshKey}`} />
              </View>

              <View style={styles.columnSecondary}>
                <ThemedView type="backgroundSelected" style={[styles.nextEventCard, { height: secondaryCardHeight }]}>
                  <ThemedText type="smallBold" style={styles.koreanText}>
                    다음 일정
                  </ThemedText>

                  <ScrollView
                    style={styles.nextEventScroll}
                    contentContainerStyle={styles.nextEventList}
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

                <View style={[styles.memberSearchCard, { height: secondaryCardHeight }]}>
                  <MemberSearchPanel key={`search-${refreshKey}`} />
                </View>
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
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: HEADER_GAP,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  heroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    flexShrink: 1,
  },
  greeting: {
    flexShrink: 1,
    fontFamily: KoreanFont,
    fontSize: FontSize.title,
    lineHeight: Math.round(FontSize.title * 1.25),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  koreanText: {
    fontFamily: KoreanFont,
  },
  grid: {
    flexDirection: 'row',
    gap: GRID_GAP,
    alignItems: 'stretch',
  },
  columnPrimary: {
    flex: 1.3,
    minWidth: 420,
  },
  columnSecondary: {
    flex: 1,
    minWidth: 360,
    gap: GRID_GAP,
  },
  nextEventCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  nextEventScroll: {
    flex: 1,
  },
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
  memberSearchCard: {
    flexShrink: 0,
  },
});
