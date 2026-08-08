import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  CALENDAR_FILTER_OPTIONS,
  CalendarFilterSection,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getDayEvents, getDayMarkers, type CalendarEventRecord } from '@/lib/calendar-events';
import { Accent, BorderRadius, FontSize, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type CalendarZoom = 'compact' | 'expanded';

type CalendarProps = {
  events: CalendarEventRecord[];
  activeFilters?: CalendarFilterCategory[];
  onToggleFilter?: (filter: CalendarFilterCategory) => void;
  canManageEvents?: boolean;
  onAddEvent?: (date: Date) => void;
  onEditEvent?: (event: CalendarEventRecord) => void;
  collapseWithPreservedPosition?: (
    anchorRef: RefObject<View | null>,
    onCollapse: () => void,
  ) => void;
};

function getMarkerColor(category: CalendarFilterCategory) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.color ?? '#22C55E';
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatKoreanDate(date: Date) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

function getCategoryLabel(category: CalendarFilterCategory) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.label ?? category;
}

export function Calendar({
  events,
  activeFilters = [],
  onToggleFilter,
  canManageEvents = false,
  onAddEvent,
  onEditEvent,
  collapseWithPreservedPosition,
}: CalendarProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const zoomAnchorRef = useRef<View>(null);
  const [today, setToday] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [zoom, setZoom] = useState<CalendarZoom>('expanded');

  const isExpanded = zoom === 'expanded';
  // Keep expanded weeks tall enough that event titles stay readable.
  const expandedGridMinHeight = Math.round(Math.max(480, windowHeight * 0.58));
  const expandedWeekMinHeight = Math.max(104, Math.round(expandedGridMinHeight / 6));

  const collapseToCompact = () => {
    const collapse = () => setZoom('compact');

    if (collapseWithPreservedPosition) {
      collapseWithPreservedPosition(zoomAnchorRef, collapse);
      return;
    }

    collapse();
  };

  useEffect(() => {
    // Only used for "is this day today" grid highlighting / the "오늘로 이동"
    // button — day-level accuracy is enough, so this just needs to catch a
    // midnight rollover, not tick every second.
    const tick = () => setToday(new Date());
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  const days = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const dayCells = useMemo(
    () =>
      days.map((date) => ({
        date,
        dayEvents: date ? getDayEvents(events, date, activeFilters) : [],
        markers: date ? getDayMarkers(events, date, activeFilters) : [],
      })),
    [days, events, activeFilters],
  );

  // Grouped into weeks (rather than a flat flex-wrap grid) so each week can
  // be given an equal flex share of whatever height the screen has to offer
  // — the grid always fills its container exactly, with no page scrolling,
  // no matter how many weeks the month spans or how tall the device is.
  const weekRows = useMemo(() => {
    const rows: (typeof dayCells)[] = [];
    for (let i = 0; i < dayCells.length; i += 7) {
      rows.push(dayCells.slice(i, i + 7));
    }
    return rows;
  }, [dayCells]);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setToday(now);
    setSelectedDate(null);
  };

  const handleDayPress = (date: Date) => {
    if (isExpanded) {
      return;
    }

    const eventsForDay = getDayEvents(events, date, activeFilters);
    if (eventsForDay.length === 0) {
      if (canManageEvents) {
        onAddEvent?.(date);
      }
      return;
    }

    setSelectedDate((current) => (current && isSameDay(current, date) ? null : date));
  };

  useEffect(() => {
    setSelectedDate(null);
  }, [activeFilters]);

  const visibleSelectedEvents =
    !isExpanded &&
    selectedDate &&
    selectedDate.getFullYear() === viewDate.getFullYear() &&
    selectedDate.getMonth() === viewDate.getMonth()
      ? getDayEvents(events, selectedDate, activeFilters)
      : [];

  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.container,
        isExpanded && styles.containerExpanded,
        isDark ? styles.containerShadowDark : styles.containerShadowLight,
      ]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="이전 달"
          onPress={goToPrevMonth}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold">‹</ThemedText>
        </Pressable>

        <ThemedText type="smallBold" style={styles.monthLabel}>
          {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
        </ThemedText>

        <Pressable
          accessibilityLabel="다음 달"
          onPress={goToNextMonth}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold">›</ThemedText>
        </Pressable>
      </View>

      {!isCurrentMonth && (
        <Pressable
          accessibilityLabel="이번 달로 돌아가기"
          onPress={goToToday}
          style={({ pressed }) => [
            styles.backToMonthButton,
            { borderColor: theme.border, backgroundColor: isDark ? '#2F4036' : '#DCFCE7' },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.backToMonthLabel}>
            이번 달로 돌아가기
          </ThemedText>
        </Pressable>
      )}

      {onToggleFilter && (
        <CalendarFilterSection
          layout="panel"
          selectedFilters={activeFilters}
          onToggleFilter={onToggleFilter}
        />
      )}

      <View ref={zoomAnchorRef} style={styles.zoomControls}>
        <Pressable
          accessibilityLabel="축소"
          disabled={!isExpanded}
          onPress={collapseToCompact}
          style={({ pressed }) => [
            styles.zoomButton,
            { borderColor: theme.border },
            !isExpanded && styles.zoomButtonDisabled,
            pressed && isExpanded && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor={isExpanded ? 'text' : 'textSecondary'}>
            −
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.zoomLabel}>
          {isExpanded ? '확대 보기' : '축소 보기'}
        </ThemedText>

        <Pressable
          accessibilityLabel="확대"
          disabled={isExpanded}
          onPress={() => {
            setZoom('expanded');
            setSelectedDate(null);
          }}
          style={({ pressed }) => [
            styles.zoomButton,
            { borderColor: theme.border },
            isExpanded && styles.zoomButtonDisabled,
            pressed && !isExpanded && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor={!isExpanded ? 'text' : 'textSecondary'}>
            +
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday, index) => (
          <ThemedText
            key={weekday}
            type="smallBold"
            themeColor="textSecondary"
            style={[styles.weekday, index === 0 && styles.sundayText]}>
            {weekday}
          </ThemedText>
        ))}
      </View>

      <View style={[styles.grid, isExpanded && { minHeight: expandedGridMinHeight }]}>
        {weekRows.map((week, weekIndex) => (
          <View
            key={weekIndex}
            style={[styles.weekRow, isExpanded && { minHeight: expandedWeekMinHeight }]}>
            {week.map(({ date, dayEvents, markers }, index) => {
              const isToday = date ? isSameDay(date, today) : false;
              const isSunday = date?.getDay() === 0;
              const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false;
              const hasEvents = dayEvents.length > 0;
              // Prefer church events as the "main" titles; keep birthdays after.
              const orderedDayEvents = [...dayEvents].sort((a, b) => {
                if (a.category === b.category) {
                  return 0;
                }
                return a.category === 'events' ? -1 : 1;
              });

              const dayInner = (
                <View style={[styles.dayContent, isExpanded && styles.dayContentExpanded]}>
                  <View
                    style={[
                      styles.dayCell,
                      isExpanded && styles.dayCellExpanded,
                      isToday && { backgroundColor: Accent.green },
                      isSelected &&
                        !isToday && {
                          backgroundColor: isDark ? '#2F4036' : '#DCFCE7',
                          borderWidth: 1,
                          borderColor: Accent.green,
                        },
                    ]}>
                    <ThemedText
                      type="small"
                      style={[
                        styles.dayText,
                        isExpanded && styles.dayTextExpanded,
                        isSunday && !isToday && styles.sundayText,
                        isToday && styles.todayText,
                        isSelected &&
                          !isToday && {
                            color: isDark ? '#A7F3C0' : '#15803D',
                            fontWeight: '700',
                          },
                      ]}>
                      {date?.getDate()}
                    </ThemedText>
                  </View>

                  {isExpanded ? (
                    hasEvents ? (
                      <View style={styles.expandedEvents}>
                        {orderedDayEvents.map((event, eventIndex) => {
                          const isMainEvent = event.category === 'events' || eventIndex === 0;
                          const card = (
                            <View
                              style={[
                                styles.expandedEventCard,
                                isMainEvent && styles.expandedEventCardMain,
                                { borderLeftColor: getMarkerColor(event.category) },
                              ]}>
                              <ThemedText
                                type="smallBold"
                                style={[
                                  styles.expandedEventTitle,
                                  isMainEvent && styles.expandedEventTitleMain,
                                ]}
                                numberOfLines={isMainEvent ? 3 : 2}>
                                {event.title}
                              </ThemedText>
                            </View>
                          );

                          if (!canManageEvents) {
                            return <View key={event.id}>{card}</View>;
                          }

                          return (
                            <Pressable
                              key={event.id}
                              accessibilityLabel={`${event.title} 수정`}
                              onPress={() => onEditEvent?.(event)}
                              style={({ pressed }) => pressed && styles.pressed}>
                              {card}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : canManageEvents && date ? (
                      <Pressable
                        accessibilityLabel={`${date.getDate()}일 일정 추가`}
                        onPress={() => onAddEvent?.(date)}
                        style={({ pressed }) => [
                          styles.expandedEmptySpace,
                          pressed && styles.pressed,
                        ]}
                      />
                    ) : (
                      <View style={styles.expandedEmptySpace} />
                    )
                  ) : markers.length > 0 ? (
                    <View style={styles.markerRow}>
                      {markers.map((marker) => (
                        <View
                          key={marker}
                          style={[styles.markerDot, { backgroundColor: getMarkerColor(marker) }]}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.markerSpacer} />
                  )}
                </View>
              );

              return (
                <View
                  key={`${weekIndex}-${date?.toISOString() ?? 'empty'}-${index}`}
                  style={[
                    styles.cell,
                    isExpanded ? styles.cellExpanded : styles.cellCompact,
                    isExpanded && { minHeight: expandedWeekMinHeight },
                    { borderBottomColor: theme.border },
                  ]}>
                  {date ? (
                    !isExpanded && (hasEvents || canManageEvents) ? (
                      <Pressable
                        accessibilityLabel={
                          hasEvents ? `${date.getDate()}일 일정 보기` : `${date.getDate()}일 일정 추가`
                        }
                        onPress={() => handleDayPress(date)}
                        style={({ pressed }) => [
                          styles.dayPressable,
                          !isExpanded && styles.dayPressableCompact,
                          pressed && styles.pressed,
                        ]}>
                        {dayInner}
                      </Pressable>
                    ) : (
                      <View style={[styles.dayPressable, !isExpanded && styles.dayPressableCompact]}>
                        {dayInner}
                      </View>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {selectedDate && visibleSelectedEvents.length > 0 ? (
        <ThemedView type="backgroundSelected" style={styles.eventPanel}>
          <View style={styles.eventPanelHeader}>
            <ThemedText type="smallBold" style={styles.eventPanelTitle}>
              {formatKoreanDate(selectedDate)}
            </ThemedText>
            {canManageEvents && (
              <Pressable
                accessibilityLabel="일정 추가"
                onPress={() => onAddEvent?.(selectedDate)}
                style={({ pressed }) => [styles.addEventButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  + 추가
                </ThemedText>
              </Pressable>
            )}
          </View>
          <View style={styles.eventList}>
            {visibleSelectedEvents.map((event) => {
              const item = (
                <View style={styles.eventItem}>
                  <View style={styles.eventItemHeader}>
                    <View
                      style={[styles.eventCategoryDot, { backgroundColor: getMarkerColor(event.category) }]}
                    />
                    <ThemedText type="smallBold" style={styles.eventCategoryLabel}>
                      {getCategoryLabel(event.category)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={styles.eventTitle}>
                    {event.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.eventDetail}>
                    {event.detail}
                  </ThemedText>
                </View>
              );

              if (!canManageEvents) {
                return <View key={event.id}>{item}</View>;
              }

              return (
                <Pressable
                  key={event.id}
                  accessibilityLabel={`${event.title} 수정`}
                  onPress={() => onEditEvent?.(event)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  {item}
                </Pressable>
              );
            })}
          </View>
        </ThemedView>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
        {isExpanded
          ? '− 버튼을 누르면 점 표시로 돌아갑니다.'
          : '일정이 있는 날짜를 누르거나 + 버튼으로 확대하세요.'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  containerExpanded: {
    flexGrow: 1,
  },
  containerShadowLight: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.3)', inset: true }],
  },
  containerShadowDark: {
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 4, color: 'rgba(255, 255, 255, 0.06)', inset: true }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  zoomButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonDisabled: {
    opacity: 0.4,
  },
  zoomLabel: {
    fontSize: FontSize.micro,
    minWidth: 52,
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  monthLabel: {
    fontSize: FontSize.small,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  navButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.micro,
  },
  grid: {
    flex: 1,
    flexDirection: 'column',
  },
  weekRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    padding: 2,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellCompact: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellExpanded: {
    alignItems: 'stretch',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  dayPressable: {
    flex: 1,
    width: '100%',
  },
  dayPressableCompact: {
    justifyContent: 'center',
  },
  dayContent: {
    alignItems: 'center',
    gap: 2,
  },
  dayContentExpanded: {
    alignItems: 'stretch',
    flex: 1,
    gap: 5,
  },
  dayCell: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dayCellExpanded: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  expandedEvents: {
    flex: 1,
    gap: 5,
    minHeight: 0,
  },
  expandedEventCard: {
    borderLeftWidth: 3,
    paddingLeft: 5,
    paddingVertical: 2,
  },
  expandedEventCardMain: {
    paddingVertical: 3,
  },
  expandedEventTitle: {
    fontSize: FontSize.caption,
    lineHeight: 15,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  expandedEventTitleMain: {
    fontSize: FontSize.small,
    lineHeight: 17,
  },
  expandedEmptySpace: {
    flex: 1,
  },
  markerRow: {
    flexDirection: 'row',
    gap: 2,
    minHeight: 4,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  markerSpacer: {
    height: 4,
  },
  dayText: {
    textAlign: 'center',
    fontSize: FontSize.micro,
    lineHeight: 14,
  },
  dayTextExpanded: {
    fontSize: FontSize.caption,
    lineHeight: 15,
  },
  sundayText: {
    color: '#E5484D',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventPanel: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  eventPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventPanelTitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  addEventButton: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.one,
  },
  eventList: {
    gap: Spacing.two,
  },
  eventItem: {
    gap: 4,
  },
  eventItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  eventCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventCategoryLabel: {
    fontSize: FontSize.micro,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventTitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  eventDetail: {
    fontSize: FontSize.micro,
    lineHeight: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  backToMonthButton: {
    alignSelf: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  backToMonthLabel: {
    color: Accent.green,
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: FontSize.micro,
    lineHeight: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  pressed: {
    opacity: 0.7,
  },
});
