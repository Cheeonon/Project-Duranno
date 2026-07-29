import { Link } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AnimatedUserName } from '@/components/animated-user-name';
import { AttendancePanel } from '@/components/attendance-panel';
import { MemberSearchPanel } from '@/components/member-search-panel';
import { HintRow } from '@/components/hint-row';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ToggleHintRow } from '@/components/toggle-hint-row';
import { UpcomingEventsSection } from '@/components/upcoming-events-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, BottomTabInset, FontSize, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';
import { useTheme } from '@/hooks/use-theme';

// The greeting is meant to wrap to exactly two lines by default. At the
// fixed `hero` size that only holds on a standard phone column (~390px+) —
// narrower phones need a smaller base size or the second line spills onto a
// third. Scales linearly between those two widths.
const GREETING_MIN_WIDTH = 340;
const GREETING_MAX_WIDTH = 420;
const GREETING_MIN_FONT_SIZE = 18;

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
  const { width } = useWindowDimensions();
  const greetingFontSize = getGreetingFontSize(width);
  const scrollRef = useRef<ScrollView>(null);
  const { handleScroll, preserveScrollPosition, collapseWithPreservedPosition, scrollOffsetRef } =
    usePreservedCollapse(scrollRef);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { profile, refreshProfile } = useAuth();

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
                paddingBottom: BottomTabInset + Spacing.five,
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
            <ThemedView style={styles.heroSection}>
              <AnimatedIcon />
              <ThemedText
                type="subtitle"
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

            <ThemedView
              type="backgroundElement"
              style={[
                styles.stepContainer,
                isDark ? styles.stepContainerShadowDark : styles.stepContainerShadowLight,
              ]}>
              <UpcomingEventsSection
                key={`events-${refreshKey}`}
                scrollRef={scrollRef}
                collapseWithPreservedPosition={collapseWithPreservedPosition}
              />

              <ToggleHintRow
                title="출결"
                isOpen={showAttendance}
                onToggle={() => setShowAttendance((current) => !current)}
                hint={showAttendance ? '접기' : '셀그룹 보기'}
                scrollRef={scrollRef}
                collapseWithPreservedPosition={collapseWithPreservedPosition}
                scrollOffsetRef={scrollOffsetRef}>
                <AttendancePanel key={`attendance-${refreshKey}`} />
              </ToggleHintRow>

              <ToggleHintRow
                title="교인 검색"
                isOpen={showMemberSearch}
                onToggle={() => setShowMemberSearch((current) => !current)}
                hint={showMemberSearch ? '접기' : '검색하기'}
                scrollRef={scrollRef}
                collapseWithPreservedPosition={collapseWithPreservedPosition}
                scrollOffsetRef={scrollOffsetRef}>
                <MemberSearchPanel
                  key={`search-${refreshKey}`}
                  scrollRef={scrollRef}
                  preserveScrollPosition={preserveScrollPosition}
                />
              </ToggleHintRow>

              <Link href="/members" asChild>
                <Pressable>
                  <HintRow title="성도관리" hint="바로가기" />
                </Pressable>
              </Link>

              <Link href="/settings" asChild>
                <Pressable>
                  <HintRow title="설정" hint="바로가기" />
                </Pressable>
              </Link>
            </ThemedView>
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
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  greeting: {
    alignSelf: 'stretch',
    textAlign: 'left',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: BorderRadius.lg,
  },
  stepContainerShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  stepContainerShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
});
