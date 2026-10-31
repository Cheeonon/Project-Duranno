import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedUserName } from '@/components/animated-user-name';
import { AttendancePanel } from '@/components/attendance-panel';
import { CALENDAR_FILTER_OPTIONS } from '@/components/calendar-filter';
import { MemberSearchPanel } from '@/components/member-search-panel';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Accent, BorderRadius, FontSize, KoreanFont, Shadow, Spacing, TopTabInset } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { getUpcomingEvents } from '@/lib/calendar-events';

const TOP_GAP = Spacing.four;

type DashboardPanel = 'attendance' | 'nextEvent' | 'memberSearch';

type PanelTab = { kind: 'panel'; id: DashboardPanel; label: string; icon: keyof typeof Ionicons.glyphMap };
type LinkTab = { kind: 'link'; href: '/members'; label: string; icon: keyof typeof Ionicons.glyphMap };

const TAB_ITEMS: (PanelTab | LinkTab)[] = [
  { kind: 'panel', id: 'attendance', label: '출결', icon: 'checkmark-done-outline' },
  { kind: 'panel', id: 'nextEvent', label: '다음 일정', icon: 'calendar-outline' },
  { kind: 'panel', id: 'memberSearch', label: '교인 검색', icon: 'search-outline' },
  { kind: 'link', href: '/members', label: '성도관리', icon: 'people-outline' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [topHeight, setTopHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePanel, setActivePanel] = useState<DashboardPanel>('attendance');
  const { profile, refreshProfile } = useAuth();
  const { events } = useCalendarEvents();

  const upcomingEvents = useMemo(() => getUpcomingEvents(events, new Date()), [events]);

  // Fills the remaining viewport below the header + tab bar, like the
  // mobile screen's `heroBlockMinHeight`/`panelHeight`.
  const panelHeight = Math.max(
    320,
    height - insets.top - insets.bottom - TopTabInset - Spacing.four * 2 - topHeight - TOP_GAP,
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
            <View style={styles.topBlock} onLayout={(event) => setTopHeight(event.nativeEvent.layout.height)}>
              <View style={styles.headerRow}>
                <View style={styles.headerSpacer} />

                <View style={styles.heroBlock}>
                  <ThemedText type="display" style={styles.greeting}>
                    소중한{' '}
                    <AnimatedUserName
                      name={profile?.nameKo ?? '성도'}
                      fontSize={FontSize.title + 10}
                      lineHeight={FontSize.title + 10}
                    />
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
                </View>
              </View>

              <View style={[styles.tabBar, styles.tabBarCentered]}>
                {TAB_ITEMS.map((tab) => {
                  const isActive = tab.kind === 'panel' && activePanel === tab.id;
                  const key = tab.kind === 'panel' ? tab.id : tab.href;
                  return (
                    <Pressable
                      key={key}
                      accessibilityLabel={tab.label}
                      onPress={() => (tab.kind === 'panel' ? setActivePanel(tab.id) : router.push(tab.href))}
                      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
                      <ThemedView
                        type={isActive ? 'backgroundSelected' : 'backgroundElement'}
                        style={[styles.tabButton, isActive && (isDark ? Shadow.card.dark : Shadow.card.light)]}>
                        <Ionicons
                          name={tab.icon}
                          size={18}
                          color={isActive ? theme.text : theme.textSecondary}
                        />
                        <ThemedText
                          type="smallBold"
                          themeColor={isActive ? 'text' : 'textSecondary'}
                          style={styles.koreanText}>
                          {tab.label}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.panelArea, { height: panelHeight }]}>
              {activePanel === 'attendance' && <AttendancePanel key={`attendance-${refreshKey}`} />}

              {activePanel === 'nextEvent' && (
                <ThemedView type="backgroundSelected" style={styles.nextEventCard}>
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
              )}

              {activePanel === 'memberSearch' && <MemberSearchPanel key={`search-${refreshKey}`} />}
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
    gap: TOP_GAP,
  },
  topBlock: {
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  headerSpacer: {
    flex: 1,
  },
  heroBlock: {
    flex: 2,
    alignItems: 'center',
  },
  greeting: {
    textAlign: 'center',
    fontFamily: KoreanFont,
    fontSize: FontSize.title,
    lineHeight: Math.round(FontSize.title * 1.25),
  },
  headerActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  koreanText: {
    fontFamily: KoreanFont,
  },
  tabBar: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabBarCentered: {
    justifyContent: 'center',
  },
  tabPressable: {
    borderRadius: BorderRadius.full,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
  },
  pressed: {
    opacity: 0.7,
  },
  panelArea: {
    alignSelf: 'center',
    width: '70%',
  },
  nextEventCard: {
    flex: 1,
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
});
