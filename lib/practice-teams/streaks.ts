export type DailyActivity = {
  date: string;
  count: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_CALENDAR_DAYS = 365;

export function buildActivityCalendar(
  activity: DailyActivity[],
  endDate = toIsoDate(new Date()),
  days = DEFAULT_CALENDAR_DAYS,
): DailyActivity[] {
  const counts = aggregateActivity(activity);
  const end = parseIsoDate(endDate);

  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const date = addUtcDays(end, -offset);
    const isoDate = toIsoDate(date);

    return {
      date: isoDate,
      count: counts.get(isoDate) ?? 0,
    };
  });
}

export function calculateTeamStreaks(
  activity: DailyActivity[],
  today = toIsoDate(new Date()),
): { current: number; longest: number; calendar: DailyActivity[] } {
  const calendar = buildActivityCalendar(activity, today, DEFAULT_CALENDAR_DAYS);
  let currentRun = 0;
  let longest = 0;

  for (const day of calendar) {
    if (day.count > 0) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  const current = calendar.at(-1)?.count ? currentRun : 0;

  return { current, longest, calendar };
}

function aggregateActivity(activity: DailyActivity[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of activity) {
    if (item.count <= 0) {
      continue;
    }

    const date = toIsoDate(parseIsoDate(item.date));
    counts.set(date, (counts.get(date) ?? 0) + item.count);
  }

  return counts;
}

function parseIsoDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return new Date(start + days * MS_PER_DAY);
}
