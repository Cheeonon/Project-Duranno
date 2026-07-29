import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Calendar } from '@/components/calendar';
import {
  CalendarFilterSection,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';
import { useTheme } from '@/hooks/use-theme';

export default function CalendarScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { handleScroll, collapseWithPreservedPosition } = usePreservedCollapse(scrollRef);
  const [selectedFilters, setSelectedFilters] = useState<CalendarFilterCategory[]>([
    'birthdays',
    'events',
  ]);
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.two,
      paddingBottom: Spacing.four,
    },
  });

  const toggleFilter = (filter: CalendarFilterCategory) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };

  return (
    <TabScreenSlide tabIndex={1}>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">달력</ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              교회 일정과 출결을 확인할 수 있는 달력입니다.
            </ThemedText>
          </ThemedView>

          <View style={styles.calendarSection}>
            <CalendarFilterSection
              selectedFilters={selectedFilters}
              onToggleFilter={toggleFilter}
            />
            <View style={styles.calendarWrapper}>
              <Calendar
                activeFilters={selectedFilters}
                collapseWithPreservedPosition={collapseWithPreservedPosition}
              />
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </TabScreenSlide>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  calendarSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  calendarWrapper: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
