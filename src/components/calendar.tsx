import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CALENDAR_FILTER_OPTIONS,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getDayEvents, getDayMarkers } from '@/constants/calendar-demo';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type CalendarZoom = 'compact' | 'expanded';

type CalendarProps = {
  activeFilters?: CalendarFilterCategory[];
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

function formatTime(date: Date) {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function getCategoryLabel(category: CalendarFilterCategory) {
  return CALENDAR_FILTER_OPTIONS.find((option) => option.id === category)?.label ?? category;
}

export function Calendar({ activeFilters = [] }: CalendarProps) {
  const [today, setToday] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [zoom, setZoom] = useState<CalendarZoom>('compact');

  const isExpanded = zoom === 'expanded';

  useEffect(() => {
    const tick = () => setToday(new Date());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

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

    const events = getDayEvents(date.getDate(), activeFilters);
    if (events.length === 0) {
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
      ? getDayEvents(selectedDate.getDate(), activeFilters)
      : [];

  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.todayBanner}>
        <ThemedText type="smallBold" style={styles.bannerDate}>
          {formatKoreanDate(today)}
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary" style={styles.bannerTime}>
          {formatTime(today)}
        </ThemedText>
      </View>

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

      <View style={styles.zoomControls}>
        <Pressable
          accessibilityLabel="축소"
          disabled={!isExpanded}
          onPress={() => setZoom('compact')}
          style={({ pressed }) => [
            styles.zoomButton,
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

      <View style={styles.grid}>
        {days.map((date, index) => {
          const isToday = date ? isSameDay(date, today) : false;
          const isSunday = date?.getDay() === 0;
          const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false;
          const dayEvents = date ? getDayEvents(date.getDate(), activeFilters) : [];
          const markers = date ? getDayMarkers(date.getDate(), activeFilters) : [];
          const hasEvents = dayEvents.length > 0;

          const dayInner = (
            <View style={[styles.dayContent, isExpanded && styles.dayContentExpanded]}>
              <View
                style={[
                  styles.dayCell,
                  isExpanded && styles.dayCellExpanded,
                  isToday && { backgroundColor: '#22C55E' },
                  isSelected && !isToday && styles.selectedDayCell,
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.dayText,
                    isSunday && !isToday && styles.sundayText,
                    isToday && styles.todayText,
                    isSelected && !isToday && styles.selectedDayText,
                  ]}>
                  {date?.getDate()}
                </ThemedText>
              </View>

              {isExpanded ? (
                hasEvents ? (
                  <View style={styles.expandedEvents}>
                    {dayEvents.map((event) => (
                      <View
                        key={`${event.category}-${event.title}`}
                        style={[
                          styles.expandedEventCard,
                          { borderLeftColor: getMarkerColor(event.category) },
                        ]}>
                        <ThemedText type="smallBold" style={styles.expandedEventTitle} numberOfLines={2}>
                          {event.title}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={styles.expandedEventDetail}
                          numberOfLines={2}>
                          {event.detail}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
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
              key={`${date?.toISOString() ?? 'empty'}-${index}`}
              style={[styles.cell, isExpanded ? styles.cellExpanded : styles.cellCompact]}>
              {date ? (
                !isExpanded && hasEvents ? (
                  <Pressable
                    accessibilityLabel={`${date.getDate()}일 일정 보기`}
                    onPress={() => handleDayPress(date)}
                    style={({ pressed }) => [styles.dayPressable, pressed && styles.pressed]}>
                    {dayInner}
                  </Pressable>
                ) : (
                  <View style={styles.dayPressable}>{dayInner}</View>
                )
              ) : null}
            </View>
          );
        })}
      </View>

      {!isCurrentMonth && (
        <Pressable onPress={goToToday} style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}>
          <ThemedText type="link">오늘로 이동</ThemedText>
        </Pressable>
      )}

      {selectedDate && visibleSelectedEvents.length > 0 ? (
        <ThemedView type="backgroundSelected" style={styles.eventPanel}>
          <ThemedText type="smallBold" style={styles.eventPanelTitle}>
            {formatKoreanDate(selectedDate)}
          </ThemedText>
          <View style={styles.eventList}>
            {visibleSelectedEvents.map((event) => (
              <View key={`${event.category}-${event.title}`} style={styles.eventItem}>
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
            ))}
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 512,
    borderRadius: BorderRadius.md,
    padding: 19,
    gap: 13,
  },
  todayBanner: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingBottom: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D5',
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
    borderColor: '#B0B4BA',
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
    fontSize: FontSize.caption,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    padding: 2,
  },
  cellCompact: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellExpanded: {
    minHeight: 108,
    alignItems: 'stretch',
  },
  dayPressable: {
    flex: 1,
    width: '100%',
  },
  dayContent: {
    alignItems: 'center',
    gap: 2,
  },
  dayContentExpanded: {
    alignItems: 'stretch',
    flex: 1,
    gap: 4,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  expandedEvents: {
    flex: 1,
    gap: 4,
  },
  expandedEventCard: {
    borderLeftWidth: 3,
    paddingLeft: 4,
    paddingVertical: 2,
    gap: 2,
  },
  expandedEventTitle: {
    fontSize: FontSize.micro,
    lineHeight: 12,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  expandedEventDetail: {
    fontSize: FontSize.micro,
    lineHeight: 11,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
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
  bannerDate: {
    fontSize: FontSize.caption,
    lineHeight: 16,
  },
  bannerTime: {
    fontSize: FontSize.micro,
    lineHeight: 11,
  },
  sundayText: {
    color: '#E5484D',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedDayCell: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  selectedDayText: {
    color: '#15803D',
    fontWeight: '700',
  },
  eventPanel: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  eventPanelTitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
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
  todayButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
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
