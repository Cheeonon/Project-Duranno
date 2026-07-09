import type { CalendarFilterCategory } from '@/components/calendar-filter';

export type CalendarEvent = {
  category: CalendarFilterCategory;
  title: string;
  detail: string;
};

export const DEMO_EVENTS_BY_DAY: Record<number, CalendarEvent[]> = {
  4: [
    {
      category: 'events',
      title: '전교인 기도회',
      detail: '오후 7:30 · 본당',
    },
  ],
  7: [
    {
      category: 'birthdays',
      title: '김민수 집사 생일',
      detail: '1층 로비에서 축하 카드 전달',
    },
  ],
  12: [
    {
      category: 'events',
      title: '청년부 야외예배',
      detail: '오전 10:00 · 교회 앞마당',
    },
  ],
  15: [
    {
      category: 'birthdays',
      title: '이은혜 권사 생일',
      detail: '성가대원 · 축하 기도 요청',
    },
  ],
  18: [
    {
      category: 'events',
      title: '교육부 수련회',
      detail: '오전 9:00 · 교육관 2층',
    },
  ],
  23: [
    {
      category: 'birthdays',
      title: '박준호 형제 생일',
      detail: '청년부 · 식사 축하 예정',
    },
  ],
  25: [
    {
      category: 'events',
      title: '추수감사절 특별예배',
      detail: '오전 11:00 · 본당',
    },
  ],
};

export function getDayMarkers(
  day: number,
  activeFilters: CalendarFilterCategory[],
): CalendarFilterCategory[] {
  const events = DEMO_EVENTS_BY_DAY[day] ?? [];
  const categories = new Set(events.map((event) => event.category));

  return [...categories].filter((category) => activeFilters.includes(category));
}

export function getDayEvents(
  day: number,
  activeFilters: CalendarFilterCategory[],
): CalendarEvent[] {
  const events = DEMO_EVENTS_BY_DAY[day] ?? [];
  return events.filter((event) => activeFilters.includes(event.category));
}

export type UpcomingEvent = CalendarEvent & {
  date: Date;
  dateLabel: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatUpcomingDate(date: Date) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

export function getUpcomingEvents(
  fromDate = new Date(),
  activeFilters?: CalendarFilterCategory[],
): UpcomingEvent[] {
  const today = startOfDay(fromDate);
  const year = today.getFullYear();
  const month = today.getMonth();
  const events: UpcomingEvent[] = [];
  const filters = activeFilters ?? ['birthdays', 'events'];

  for (const [dayStr, dayEvents] of Object.entries(DEMO_EVENTS_BY_DAY)) {
    const day = Number(dayStr);
    const date = new Date(year, month, day);

    if (date < today) {
      continue;
    }

    for (const event of dayEvents) {
      if (!filters.includes(event.category)) {
        continue;
      }

      events.push({
        ...event,
        date,
        dateLabel: formatUpcomingDate(date),
      });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
