import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { AnimatedUserName } from '@/components/animated-user-name';
import { AttendancePanel } from '@/components/attendance-panel';
import { MemberSearchPanel } from '@/components/member-search-panel';
import { HintRow } from '@/components/hint-row';
import { ToggleHintRow } from '@/components/toggle-hint-row';
import { UpcomingEventsSection } from '@/components/upcoming-events-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { DEMO_CURRENT_USER } from '@/constants/user-demo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { TextSizeControl } from '@/components/text-size-control';
import { HomeTextScaleProvider } from '@/contexts/home-text-scale';
import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';

export default function HomeScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const { handleScroll, preserveScrollPosition } = usePreservedCollapse(scrollRef);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  return (
    <HomeTextScaleProvider>
      <ThemedView style={styles.container}>
        <TextSizeControl />
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
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.heroSection}>
            <AnimatedIcon />
            <ThemedText type="subtitle" style={styles.greeting}>
              소중한{' '}
              <AnimatedUserName name={DEMO_CURRENT_USER.firstName} />
              님,{'\n'}
              오늘도 교회를 위해 함께 해주셔서 감사해요.
            </ThemedText>
          </ThemedView>

          <ThemedText type="code" style={styles.code}>
            get started
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <UpcomingEventsSection scrollRef={scrollRef} />

            <ToggleHintRow
              title="출결"
              isOpen={showAttendance}
              onToggle={() => setShowAttendance((current) => !current)}
              hint={showAttendance ? '접기' : '셀그룹 보기'}
              scrollRef={scrollRef}>
              <AttendancePanel />
            </ToggleHintRow>

            <ToggleHintRow
              title="교인 검색"
              isOpen={showMemberSearch}
              onToggle={() => setShowMemberSearch((current) => !current)}
              hint={showMemberSearch ? '접기' : '검색하기'}
              scrollRef={scrollRef}>
              <MemberSearchPanel
                scrollRef={scrollRef}
                preserveScrollPosition={preserveScrollPosition}
              />
            </ToggleHintRow>

            <HintRow title="나중에 추가할 메뉴" />
          </ThemedView>

          {Platform.OS === 'web' && <WebBadge />}
        </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </HomeTextScaleProvider>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.six,
  },
  greeting: {
    alignSelf: 'stretch',
    textAlign: 'left',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  code: {
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
