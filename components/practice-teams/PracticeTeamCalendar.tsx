import type { CSSProperties } from "react";

import type { DailyActivity } from "@/lib/practice-teams/streaks";

type ColorScheme = "emerald" | "violet" | "amber" | "blue";
type Density = "compact" | "comfortable";

type Props = {
  calendar: DailyActivity[];
  current: number;
  longest: number;
  title?: string;
  subtitle?: string;
  colorScheme?: ColorScheme;
  density?: Density;
  showWeekdayLabels?: boolean;
  showMonthLabels?: boolean;
  showLegend?: boolean;
};

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const CELL_SIZE: Record<Density, string> = {
  compact: "h-2.5 w-2.5",
  comfortable: "h-3 w-3",
};

const GRID_COLUMNS: Record<Density, string> = {
  compact: "grid-cols-[repeat(var(--week-count),0.625rem)]",
  comfortable: "grid-cols-[repeat(var(--week-count),0.75rem)]",
};

const COLOR_CLASSES: Record<ColorScheme, string[]> = {
  emerald: ["bg-zinc-800", "bg-emerald-950", "bg-emerald-800", "bg-emerald-600", "bg-emerald-300"],
  violet: ["bg-zinc-800", "bg-violet-950", "bg-violet-800", "bg-violet-600", "bg-violet-300"],
  amber: ["bg-zinc-800", "bg-amber-950", "bg-amber-800", "bg-amber-500", "bg-amber-300"],
  blue: ["bg-zinc-800", "bg-sky-950", "bg-sky-800", "bg-sky-500", "bg-sky-300"],
};

export default function PracticeTeamCalendar({
  calendar,
  current,
  longest,
  title = "Team streak",
  subtitle,
  colorScheme = "emerald",
  density = "comfortable",
  showWeekdayLabels = true,
  showMonthLabels = true,
  showLegend = true,
}: Props) {
  const weeks = buildCalendarWeeks(calendar);
  const monthLabels = buildMonthLabels(weeks);
  const totalActivity = calendar.reduce((sum, day) => sum + day.count, 0);
  const activeDays = calendar.filter((day) => day.count > 0).length;
  const bestDay = calendar.reduce<DailyActivity | null>((best, day) => {
    if (!best || day.count > best.count) return day;
    return best;
  }, null);
  const gridRowsClass = "grid-rows-7";
  const cellSize = CELL_SIZE[density];
  const colors = COLOR_CLASSES[colorScheme];
  const weekStyle = { "--week-count": weeks.length } as CSSProperties;

  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-zinc-950 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
            {subtitle ?? `${current} current streak · ${longest} longest streak`}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3 border-y border-white/10 py-3 sm:grid-cols-4">
          <CalendarStat label="Current" value={current} />
          <CalendarStat label="Longest streak" value={longest} />
          <CalendarStat label="Active days" value={activeDays} />
          <CalendarStat label="Total activity" value={totalActivity} />
        </div>
      </div>

      <div className="mt-5">
        <div className="overflow-x-auto pb-2" tabIndex={0} role="region" aria-label="Team activity calendar">
        <div className="w-max">
        {showMonthLabels && (
          <div className={`${showWeekdayLabels ? "ml-9" : ""} grid w-max ${GRID_COLUMNS[density]} gap-1 text-xs text-zinc-400`} style={weekStyle}>
            {monthLabels.map((label, index) => (
              <span key={`${label.index}-${label.month}`} className="overflow-hidden whitespace-nowrap" style={{ gridColumn: `${label.index + 1} / ${monthLabels[index + 1] ? monthLabels[index + 1].index + 1 : weeks.length + 1}` }}>
                {(monthLabels[index + 1]?.index ?? weeks.length) - label.index >= 3 ? label.month : ""}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex min-w-0 gap-2">
          {showWeekdayLabels && (
            <div className="grid grid-rows-7 gap-1 text-[10px] leading-3 text-zinc-500">
              {WEEKDAY_LABELS.map((label, index) => (
                <span key={`${label}-${index}`} className={`${density === "compact" ? "h-2.5" : "h-3"} w-7`}>
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="min-w-0">
            <div className={`grid w-max grid-flow-col ${gridRowsClass} ${GRID_COLUMNS[density]} gap-1`} style={weekStyle}>
              {weeks.flatMap((week, weekIndex) =>
                week.map((day, dayIndex) =>
                  day ? (
                    <span
                      key={day.date}
                      aria-label={`${day.date}: ${day.count} practice activities`}
                      className={`${cellSize} rounded-[3px] ring-1 ring-white/[0.03] ${intensityClass(day.count, colors)}`}
                      title={`${day.date}: ${day.count}`}
                    />
                  ) : (
                    <span key={`empty-${weekIndex}-${dayIndex}`} className={`${cellSize} rounded-[3px] bg-transparent`} aria-hidden="true" />
                  ),
                ),
              )}
            </div>
          </div>
        </div>
        </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-zinc-500">
          <p>
            Best day:{" "}
            <span className="font-medium text-zinc-300">
              {bestDay && bestDay.count > 0 ? `${bestDay.date} · ${bestDay.count}` : "No activity yet"}
            </span>
          </p>
          {showLegend && (
            <div className="flex items-center gap-1">
              <span>Less</span>
              {colors.map((color, level) => (
                <span key={level} aria-hidden="true" className={`${cellSize} rounded-[3px] ${color}`} />
              ))}
              <span>More</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CalendarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="text-lg font-semibold tabular-nums text-white">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function buildCalendarWeeks(calendar: DailyActivity[]): Array<Array<DailyActivity | null>> {
  const weeks: Array<Array<DailyActivity | null>> = [];

  for (const day of calendar) {
    const dayIndex = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (weeks.length === 0) {
      weeks.push(Array.from({ length: 7 }, () => null));
    }

    const currentWeek = weeks[weeks.length - 1];
    if (currentWeek[dayIndex]) {
      weeks.push(Array.from({ length: 7 }, () => null));
    }

    weeks[weeks.length - 1][dayIndex] = day;
  }

  return weeks;
}

function buildMonthLabels(weeks: Array<Array<DailyActivity | null>>): Array<{ month: string; index: number }> {
  const labels: Array<{ month: string; index: number }> = [];
  let lastMonth = "";

  weeks.forEach((week, index) => {
    const firstRealDay = week.find(Boolean);
    if (!firstRealDay) return;

    const month = new Date(`${firstRealDay.date}T00:00:00Z`).toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });

    if (month !== lastMonth) {
      labels.push({ month, index });
      lastMonth = month;
    }
  });

  return labels;
}

function intensityClass(count: number, colors: string[]): string {
  if (count <= 0) return colors[0];
  if (count === 1) return colors[1];
  if (count <= 3) return colors[2];
  if (count <= 6) return colors[3];
  return colors[4];
}
