import { useMemo, useRef, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import {
  CALENDAR_FILTER_OPTIONS,
  CalendarFilterSection,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import { CollapsiblePanel } from '@/components/collapsible-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getUpcomingEvents, type UpcomingEvent } from '@/constants/calendar-demo';
import { usePreservedCollapse } from '@/hooks/use-preserved-collapse';
import { Spacing } from '@/constants/theme';

function getCategoryColor(category: UpcomingEvent['category']) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.color ?? '#22C55E';
}

function getCategoryLabel(category: UpcomingEvent['category']) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.label ?? category;
}

type UpcomingEventsSectionProps = {
  scrollRef?: RefObject<ScrollView | null>;
};

export function UpcomingEventsSection({ scrollRef }: UpcomingEventsSectionProps) {
  const headerRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<CalendarFilterCategory[]>([
    'birthdays',
    'events',
  ]);
  const { toggleWithPreservedPosition } = usePreservedCollapse(scrollRef ?? { current: null });

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(new Date(), selectedFilters),
    [selectedFilters],
  );
  const nextEvent = upcomingEvents[0];

  const toggleFilter = (filter: CalendarFilterCategory) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };

  const collapsedHint = nextEvent
    ? `다음 · ${nextEvent.date.getMonth() + 1}/${nextEvent.date.getDate()} ${nextEvent.title}`
    : '일정 없음';

  const handlePress = () => {
    const toggle = () => setIsOpen((current) => !current);

    if (scrollRef) {
      toggleWithPreservedPosition(isOpen, headerRef, toggle);
      return;
    }

    toggle();
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        ref={headerRef}
        accessibilityLabel={`Upcoming Events ${isOpen ? '접기' : '펼치기'}`}
        onPress={handlePress}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}>
        <View style={styles.headerLeft}>
          <ThemedText type="smallBold" style={styles.title}>
            Upcoming Events
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={[styles.previewText, isOpen && styles.previewHidden]}
            numberOfLines={1}>
            {collapsedHint}
          </ThemedText>
        </View>

        <ThemedView type="backgroundSelected" style={styles.toggleBadge}>
          <ThemedText type="small" themeColor="textSecondary">
            {isOpen ? '접기' : `${upcomingEvents.length}건`}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <CollapsiblePanel isOpen={isOpen}>
        <CalendarFilterSection
          layout="panel"
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
        />

        <View style={styles.eventsList}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <ThemedView
                key={`${event.date.toISOString()}-${event.title}`}
                type="backgroundSelected"
                style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <ThemedText type="smallBold" style={styles.eventDate}>
                    {event.dateLabel}
                  </ThemedText>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
                    <ThemedText style={styles.categoryBadgeText}>{getCategoryLabel(event.category)}</ThemedText>
                  </View>
                </View>

                <ThemedText type="smallBold" style={styles.eventTitle}>
                  {event.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.eventDetail}>
                  {event.detail}
                </ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedView type="backgroundSelected" style={styles.emptyState}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                선택한 필터에 해당하는 일정이 없습니다.
              </ThemedText>
            </ThemedView>
          )}
        </View>
      </CollapsiblePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  previewText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  previewHidden: {
    opacity: 0,
  },
  toggleBadge: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  eventsList: {
    gap: Spacing.one,
  },
  eventCard: {
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  eventDate: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventTitle: {
    fontSize: 11,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventDetail: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  emptyState: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
