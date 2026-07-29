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
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { getUpcomingEvents, type UpcomingEvent } from '@/lib/calendar-events';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

function getCategoryColor(category: UpcomingEvent['category']) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.color ?? '#22C55E';
}

function getCategoryLabel(category: UpcomingEvent['category']) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.label ?? category;
}

type UpcomingEventsSectionProps = {
  scrollRef?: RefObject<ScrollView | null>;
  // Must be the parent's live usePreservedCollapse() instance (the one wired
  // to the ScrollView's onScroll), not a fresh call here — a fresh instance's
  // scrollOffsetRef never tracks real scroll position.
  collapseWithPreservedPosition?: (
    anchorRef: RefObject<View | null>,
    onCollapse: () => void,
  ) => void;
};

export function UpcomingEventsSection({
  scrollRef,
  collapseWithPreservedPosition,
}: UpcomingEventsSectionProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = useTheme();
  const headerRef = useRef<View>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<CalendarFilterCategory[]>([
    'birthdays',
    'events',
  ]);
  const { events } = useCalendarEvents();

  const upcomingEvents = useMemo(
    () => getUpcomingEvents(events, new Date(), selectedFilters),
    [events, selectedFilters],
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

    if (isOpen && scrollRef && collapseWithPreservedPosition) {
      collapseWithPreservedPosition(headerRef, toggle);
      return;
    }

    toggle();
  };

  return (
    <ThemedView
      type="backgroundSelected"
      style={[styles.wrapper, isDark ? styles.wrapperShadowDark : styles.wrapperShadowLight]}>
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

        <ThemedView
          type="background"
          style={[styles.toggleBadge, isOpen && styles.toggleBadgeOpen]}>
          <ThemedText type="small" themeColor="textSecondary">
            {isOpen ? '접기' : `${upcomingEvents.length}건`}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <CollapsiblePanel isOpen={isOpen}>
        <ThemedView
          type="backgroundElement"
          style={[
            styles.contentBox,
            isDark ? styles.contentBoxShadowDark : styles.contentBoxShadowLight,
          ]}>
          <CalendarFilterSection
            layout="panel"
            selectedFilters={selectedFilters}
            onToggleFilter={toggleFilter}
          />

          <View style={styles.eventsList}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <ThemedView
                  key={event.id}
                  type="backgroundElement"
                  style={[
                    styles.eventCard,
                    index < upcomingEvents.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}>
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
              <ThemedView type="background" style={styles.emptyState}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  선택한 필터에 해당하는 일정이 없습니다.
                </ThemedText>
              </ThemedView>
            )}
          </View>
        </ThemedView>
      </CollapsiblePanel>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
  },
  wrapperShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  wrapperShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
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
    fontSize: FontSize.micro,
    lineHeight: 13,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  previewHidden: {
    opacity: 0,
  },
  toggleBadge: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  toggleBadgeOpen: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  contentBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  contentBoxShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  contentBoxShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
  eventsList: {},
  eventCard: {
    paddingVertical: Spacing.two,
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
    fontSize: FontSize.micro,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  categoryBadge: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSize.micro,
    fontWeight: '700',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventTitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventDetail: {
    fontSize: FontSize.micro,
    lineHeight: 13,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  emptyState: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.micro,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
