import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Calendar } from '@/components/calendar';
import {
  CalendarFilterSection,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CalendarScreen() {
  const safeAreaInsets = useSafeAreaInsets();
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
      paddingTop: Spacing.six,
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
    <ScrollView
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
          <Calendar activeFilters={selectedFilters} />
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
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
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  calendarSection: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
});
