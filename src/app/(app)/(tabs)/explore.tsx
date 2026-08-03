import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Calendar } from '@/components/calendar';
import {
  DEFAULT_CALENDAR_FILTERS,
  type CalendarFilterCategory,
} from '@/components/calendar-filter';
import {
  CalendarEventFormModal,
  type CalendarEventFormValue,
} from '@/components/calendar-event-form-modal';
import { PullToRefreshScrollView } from '@/components/pull-to-refresh-scroll-view';
import { TabScreenSlide } from '@/components/tab-screen-slide';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useMembers } from '@/hooks/use-members';
import { useTheme } from '@/hooks/use-theme';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  mergeCalendarEvents,
  updateCalendarEvent,
  type CalendarEventRecord,
} from '@/lib/calendar-events';

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CalendarScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { profile, refreshProfile } = useAuth();
  const { events, refresh } = useCalendarEvents();
  const { members, refresh: refreshMembers } = useMembers();
  const [selectedFilters, setSelectedFilters] =
    useState<CalendarFilterCategory[]>(DEFAULT_CALENDAR_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const bottomInset = safeAreaInsets.bottom + BottomTabInset + Spacing.two;
  const theme = useTheme();

  const displayEvents = useMemo(
    () => mergeCalendarEvents(events, members),
    [events, members],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refresh(), refreshMembers()]);
      setRefreshKey((current) => current + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshMembers, refreshProfile]);

  const canManageEvents =
    profile?.permission === '관리자' || profile?.permission === '사역자';

  const [formVisible, setFormVisible] = useState(false);
  const [formInitial, setFormInitial] = useState<CalendarEventFormValue | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddEvent = (date: Date) => {
    setFormInitial({
      title: '',
      detail: '',
      category: 'events',
      eventDate: toISODate(date),
      recursAnnually: false,
    });
    setFormError(null);
    setFormVisible(true);
  };

  const openEditEvent = (event: CalendarEventRecord) => {
    if (event.readOnly || event.category !== 'events') {
      return;
    }

    setFormInitial({
      id: event.id,
      title: event.title,
      detail: event.detail,
      category: 'events',
      eventDate: event.eventDate,
      recursAnnually: event.recursAnnually,
    });
    setFormError(null);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setFormInitial(null);
    setFormError(null);
  };

  const handleSubmit = async (value: CalendarEventFormValue) => {
    setFormSubmitting(true);
    try {
      if (value.id) {
        await updateCalendarEvent(value.id, value);
      } else {
        await createCalendarEvent(value);
      }
      closeForm();
      refresh();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : '일정을 저장하지 못했습니다.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setFormSubmitting(true);
    try {
      await deleteCalendarEvent(id);
      closeForm();
      refresh();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : '일정을 삭제하지 못했습니다.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleFilter = (filter: CalendarFilterCategory) => {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };

  return (
    <TabScreenSlide tabIndex={1}>
      <View
        style={[
          styles.screen,
          { backgroundColor: theme.background, paddingTop: safeAreaInsets.top },
        ]}>
        <PullToRefreshScrollView
          style={styles.scrollView}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.container}>
            <ThemedView style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <ThemedText type="subtitle">달력</ThemedText>
                {canManageEvents && (
                  <Pressable
                    accessibilityLabel="일정 추가"
                    onPress={() => openAddEvent(new Date())}
                    style={({ pressed }) => [
                      styles.addButton,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold">+ 일정 추가</ThemedText>
                  </Pressable>
                )}
              </View>
              <ThemedText style={styles.centerText} themeColor="textSecondary">
                교회 일정과 출결을 확인할 수 있는 달력입니다.
              </ThemedText>
            </ThemedView>

            <View style={styles.calendarSection}>
              <View style={styles.calendarWrapper}>
                <Calendar
                  key={`calendar-${refreshKey}`}
                  events={displayEvents}
                  activeFilters={selectedFilters}
                  onToggleFilter={toggleFilter}
                  canManageEvents={canManageEvents}
                  onAddEvent={openAddEvent}
                  onEditEvent={openEditEvent}
                />
              </View>
            </View>
          </ThemedView>
        </PullToRefreshScrollView>
      </View>

      <CalendarEventFormModal
        visible={formVisible}
        initial={formInitial}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onDelete={canManageEvents ? handleDelete : undefined}
        submitting={formSubmitting}
        error={formError}
      />
    </TabScreenSlide>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  titleContainer: {
    gap: Spacing.one,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addButton: {
    borderRadius: Spacing.half,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo, Malgun Gothic, Nanum Gothic, Noto Sans KR, sans-serif',
  },
  calendarSection: {
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  calendarWrapper: {
    flexGrow: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
