import type { CalendarFilterCategory } from '@/components/calendar-filter';
import { supabase } from '@/lib/supabase';

export type CalendarEventRecord = {
  id: string;
  title: string;
  detail: string;
  category: CalendarFilterCategory;
  eventDate: string; // ISO date (YYYY-MM-DD), the stored anchor date
  recursAnnually: boolean;
};

export type UpcomingEvent = CalendarEventRecord & {
  date: Date;
  dateLabel: string;
};

export type CalendarEventInput = {
  title: string;
  detail: string;
  category: CalendarFilterCategory;
  eventDate: string;
  recursAnnually: boolean;
};

export type CalendarEventRow = {
  id: string;
  title: string;
  detail: string | null;
  category: CalendarFilterCategory;
  event_date: string;
  recurs_annually: boolean;
};

export function mapCalendarEventRow(row: CalendarEventRow): CalendarEventRecord {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail ?? '',
    category: row.category,
    eventDate: row.event_date,
    recursAnnually: row.recurs_annually,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseEventDate(eventDate: string) {
  const [year, month, day] = eventDate.split('-').map(Number);
  return { year, month: month - 1, day };
}

// Where this event actually falls relative to `referenceDate`. One-time
// events just use their stored date; annually-recurring ones re-anchor to
// referenceDate's year, rolling into next year once this year's date passed.
export function resolveOccurrence(event: CalendarEventRecord, referenceDate: Date): Date {
  const { year, month, day } = parseEventDate(event.eventDate);

  if (!event.recursAnnually) {
    return new Date(year, month, day);
  }

  const today = startOfDay(referenceDate);
  const thisYear = new Date(referenceDate.getFullYear(), month, day);

  return thisYear < today ? new Date(referenceDate.getFullYear() + 1, month, day) : thisYear;
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getDayEvents(
  events: CalendarEventRecord[],
  day: Date,
  activeFilters: CalendarFilterCategory[],
): CalendarEventRecord[] {
  return events.filter((event) => {
    if (!activeFilters.includes(event.category)) {
      return false;
    }

    const { month, day: eventDay } = parseEventDate(event.eventDate);

    if (event.recursAnnually) {
      return day.getMonth() === month && day.getDate() === eventDay;
    }

    return isSameDate(resolveOccurrence(event, day), day);
  });
}

export function getDayMarkers(
  events: CalendarEventRecord[],
  day: Date,
  activeFilters: CalendarFilterCategory[],
): CalendarFilterCategory[] {
  const categories = new Set(getDayEvents(events, day, activeFilters).map((event) => event.category));
  return [...categories];
}

export function formatUpcomingDate(date: Date) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

export function getUpcomingEvents(
  events: CalendarEventRecord[],
  fromDate = new Date(),
  activeFilters?: CalendarFilterCategory[],
): UpcomingEvent[] {
  const today = startOfDay(fromDate);
  const filters = activeFilters ?? ['birthdays', 'events'];

  return events
    .filter((event) => filters.includes(event.category))
    .map((event) => {
      const date = resolveOccurrence(event, fromDate);
      return { ...event, date, dateLabel: formatUpcomingDate(date) };
    })
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const { error } = await supabase.from('calendar_events').insert({
    title: input.title,
    detail: input.detail || null,
    category: input.category,
    event_date: input.eventDate,
    recurs_annually: input.recursAnnually,
  });

  if (error) {
    throw error;
  }
}

export async function updateCalendarEvent(id: string, input: CalendarEventInput) {
  const { error } = await supabase
    .from('calendar_events')
    .update({
      title: input.title,
      detail: input.detail || null,
      category: input.category,
      event_date: input.eventDate,
      recurs_annually: input.recursAnnually,
    })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
